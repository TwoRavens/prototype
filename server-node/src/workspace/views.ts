import {Router} from "express";
import {asyncHandler, AUTHENTICATE, UserError} from "../constants";
import {aggregate, deleteOne, first, firstUser, insertOne, updateOne} from "../drivers/mongo";
import {User} from "../auth/views";
import {Document, ObjectId} from "mongodb";

export function register_workspace_views(app: Router) {

    app.post('/workspace/list', AUTHENTICATE,
        asyncHandler(async (req, res, next) => {
            let user = req.user as User;
            res.send({
                success: true, data: {

                    user: await aggregate("users", [
                        {$match: {email: user.email}},
                        {$project: {_id: "$workspaces"}},
                        {$unwind: '$_id'},
                        {$lookup: {from: 'workspaces', localField: '_id', foreignField: '_id', as: '_id'}},
                        {$unwind: '$_id'},
                        {$replaceRoot: {newRoot: '$_id'}},
                    ]).then(c => c.toArray()),

                    public: await aggregate("workspaces", [
                        {$match: {public: true}}
                    ]).then(c => c.toArray())
                }
            })
        })
    );

    app.post('/workspace/activate', AUTHENTICATE, asyncHandler(async function (req, res, next) {
        let {email} = req.user as User;
        let _id = ObjectId.createFromHexString(req.body._id);

        let workspace = await first(await aggregate("workspaces", [{$match: {_id}}]),
            "Workspace not found.");

        if (!workspace.public) {
            // check that user can activate the specified workspace
            await first(await aggregate("users", [
                {$match: {email}},
                {$unwind: "$workspaces"},
                {$match: {workspaces: _id}}
            ]), "You do not have rights to the specified workspace.");
        }

        // activate the workspace
        await updateOne("users",
            {email},
            {$set: {activeWorkspaceId: _id}});

        res.send({success: true})
    }));

    // interface GetWorkspace {
    //     id: string
    // }

    app.post('/workspace/get', AUTHENTICATE, asyncHandler(async function (req, res, next) {
        let {email} = req.user as User;

        let validateId = async (id) => {
            let _id = ObjectId.createFromHexString(id);
            await first(await aggregate("users", [
                {$match: {email}},
                {$unwind: "$workspaces"},
                {$match: {workspaces: _id}}
            ]), "You do not have rights to the specified workspace.");
            return _id
        }

        let getActiveId = async () => {
            let userDoc = await firstUser(await aggregate("users", [
                {$match: {email}},
                {$project: {activeWorkspaceId: "$activeWorkspaceId"}},
            ]));
            if (!userDoc.activeWorkspaceId) throw new UserError("User does not have an active workspace.");
            return userDoc.activeWorkspaceId;
        }

        // if an id is passed, parse and validate it. Otherwise, fall back to the active workspace id
        let _id = req.body.id ? await validateId(req.body.id) : await getActiveId();

        let wsCursor = await aggregate("workspaces", [{$match: {_id}}]);
        res.send({success: true, data: await first(wsCursor, "workspace not found")})
    }));

    app.post('/workspace/save', AUTHENTICATE, asyncHandler(async function (req, res, next) {
        let {email} = req.user as User;
        let _id = ObjectId.createFromHexString(req.body._id);

        // check that user has rights to workspace
        await first(await aggregate("users",
            [{$match: {email, workspaces: _id}}]),
            "You do not have rights to the specified workspace.")

        // save to workspaces collection
        delete req.body._id;
        await updateOne("workspaces",
            {_id},
            {$set: req.body});

        res.send({success: true})
    }));

    app.post('/workspace/new', AUTHENTICATE, asyncHandler(async function (req, res, next) {
        let {email} = req.user as User;

        // treat body as new workspace
        let workspace: Document = req.body;
        delete workspace._id;
        workspace.datasetId = ObjectId.createFromHexString(req.body.datasetId);

        let dataset = await first(await aggregate("datasets", [{$match: {_id: workspace.datasetId}}]),
            "No dataset with the specified id.");

        if (!dataset.public)
            await first(await aggregate("users",
                    [{$match: {email, datasets: workspace.datasetId}}]),
                "User does not have access to specified dataset.");

        // save to workspaces collection
        workspace._id = await insertOne("workspaces", workspace);

        // user account should link to workspace
        await updateOne("users",
            {email},
            {$addToSet: {workspaces: workspace._id}});

        res.send({success: true, data: workspace._id})
    }));


    app.post('/workspace/delete', AUTHENTICATE, asyncHandler(async function (req, res, next) {
        let {email} = req.user as User;
        let _id = ObjectId.createFromHexString(req.body._id);

        // check that user has rights to workspace
        // await first(await aggregate("users",
        //         [{$match: {email, workspaces: _id}}]),
        //     "You do not have rights to the specified workspace.")

        let doc = await updateOne('users', {email}, {$pull: {workspaces: _id}});
        if ((doc.workspaces || []).every(ws => ws.toHexString() !== _id.toHexString()))
            throw new UserError("You do not have rights to the specified workspace.");

        // TODO: FOR SHARING, clear workspace id from all

        // delete the corresponding workspace entry
        await deleteOne("workspaces", {_id});

        res.send({success: true})
    }));
}
