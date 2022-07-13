import {Router} from "express";
import {asyncHandler, AUTHENTICATE, callbackHandler, TR_MONGO_DB_NAME, UserError} from "../constants";
import {readHeaders, uploadToS3} from "./controllers";
import fs from "fs";
import path from "path";
import multer from "multer";
import {aggregate, deleteMany, deleteOne, first, insertOne, updateMany, updateOne} from "../drivers/mongo";
import {User} from "../auth/views";
import {ObjectId} from "mongodb";
import {runQuery, runS3Import} from "./controllers";

// function hash(value: string): number {
//     let hash = 0;
//     for (let i = 0; i < value.length; i++) {
//         hash  = ((hash << 5) - hash) + value.charCodeAt(i);
//         hash |= 0; // Convert to 32bit integer
//     }
//     return hash;
// }

export function register_dataset_views(app: Router) {

    app.post('/dataset/list', AUTHENTICATE,
        asyncHandler(async (req, res, next) => {
            let user = req.user as User;
            res.send({
                success: true, data: {

                    user: await aggregate("users", [
                        {$match: {email: user.email}},
                        {$project: {_id: "$datasets"}},
                        {$unwind: '$_id'},
                        {$lookup: {from: 'datasets', localField: '_id', foreignField: '_id', as: '_id'}},
                        {$unwind: '$_id'},
                        {$replaceRoot: {newRoot: '$_id'}},
                    ]).then(c => c.toArray()),

                    public: await aggregate("datasets", [
                        {$match: {public: true}}
                    ]).then(c => c.toArray())
                }
            })
        })
    );

    app.post('/dataset/new-file', AUTHENTICATE,
        asyncHandler(async function (req, res, next) {
            multer({
                fileFilter: function (req, file, cb) {
                    if (path.extname(file.originalname) !== '.csv') {
                        return cb(new UserError('Only .csv files are allowed'))
                    }
                    cb(null, true)
                }
            }).single("file")(req, res, callbackHandler(res, next, async function (err) {
                if (err instanceof multer.MulterError) {
                    throw new UserError(err.message);
                } else if (err) {
                    throw err
                }

                let user = req.user as User;
                let datasetId = await insertOne("datasets", {name: req.body.name});

                // upload files to s3
                // TODO: write streaming buffer reader into s3
                await uploadToS3({
                    bucket: "tworavens",
                    key: datasetId.toHexString()
                }, req.file);

                await runS3Import({
                    s3: {
                        bucket: 'tworavens',
                        key: datasetId.toHexString()
                    },
                    mongo: {
                        database_name: TR_MONGO_DB_NAME,
                        collection_name: datasetId.toHexString()
                    }
                });

                // update mongodb
                await updateOne("users",
                    {email: user.email},
                    {$addToSet: {datasets: datasetId}});
                res.send({success: true, data: datasetId})
            }));
        })
    );

    // TODO
    // app.post('/dataset/new-s3', AUTHENTICATE,
    //     asyncHandler(async function (req, res) {
    //         let response = await runS3Import(req.body)
    //         res.send({success: true, data: response})
    //     }));

    app.post('/dataset/query', AUTHENTICATE,
        asyncHandler(async function (req, res) {
            let response = await runQuery(Object.assign(req.body, {user: req.user}))
            res.send({success: true, data: response})
        }));

    app.post('/dataset/profile', asyncHandler(async function (req, res) {
        let {query} = req.body;
            
        console.log(req.body);
        query.push({$sample: 5000});
        let data = runQuery({query, user: req.user})
        console.log("data!", data);

        res.send({success: true, data: {
                variables: [],
                count: []
            }
        })
    }));

    // read the headers from a data file
    app.post('/dataset/headers', AUTHENTICATE,
        asyncHandler(async function (req, res) {
            res.send({success: true, data: await readHeaders(req.body)})
        }));

    app.post('/dataset/metadata',
        asyncHandler(async function (req, res) {
            let readFolder = folder => req.body[folder]
                .reduce((agg, name) => Object.assign(agg, {[name]: readMetadata(folder, name)}), {});
            let readMetadata = (folder, name) => JSON.parse(fs.readFileSync(
                path.join(__dirname, 'metadata', folder, name + '.json'), {encoding: 'utf-8'}));

            let data = ['collections', 'alignments', 'formats', 'geojson']
                .filter(k => k in req.body)
                .reduce((agg, folder) =>
                    Object.assign(agg, {[folder]: readFolder(folder)}), {});

            res.send({success: true, data})
        }));


    app.post('/dataset/save', AUTHENTICATE, asyncHandler(async function (req, res, next) {
        let {email} = req.user as User;
        let _id = ObjectId.createFromHexString(req.body._id);

        // check that user has rights to dataset
        await first(await aggregate("users",
                [{$match: {email, datasets: _id}}]),
            "You do not have rights to the specified dataset.")

        // save to datasets collection
        delete req.body._id;
        await updateOne("datasets",
            {_id},
            {$set: req.body});

        res.send({success: true})
    }));


    app.post('/dataset/delete', AUTHENTICATE, asyncHandler(async function (req, res, next) {
        let {email} = req.user as User;
        let _id = ObjectId.createFromHexString(req.body._id);

        let doc = await updateOne('users', {email}, {$pull: {datasets: _id}});
        if ((doc.datasets || []).every(ds => ds?.toHexString() !== _id.toHexString()))
            throw new UserError("You do not have rights to the specified dataset.");

        // remove the dataset from all users
        await updateMany('users', {email}, {$pull: {datasets: _id}})

        // find all dependent workspace ids
        let workspaceIds = await aggregate('workspaces', [{$match: {datasetId: _id}}, {$project: {_id: 1}}])
            .then(cursor => cursor.toArray())
            .then(workspaces => workspaces.map(ws => ws._id));

        // remove all affected workspaces from all users
        await updateMany('users', {email}, {$pull: {workspaces: {$in: workspaceIds}}})

        // remove all affected workspaces
        await deleteMany('workspaces', {datasetId: _id})

        // finally, delete the dataset entry
        await deleteOne("datasets", {_id});

        res.send({success: true})
    }));
}
