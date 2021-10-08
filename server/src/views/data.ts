import * as db from '../drivers/mongo';
import {Router} from "express";
import {AUTHENTICATE} from "../constants";


export function register_data(app: Router) {
    app.post('/data/import', AUTHENTICATE,
        async function (req, res) {
            let {database, collection, data_path} = req.body;
            await db.create_from_csv(database, collection, data_path);
            res.send({success: true})
        });

    app.post('/data/import-s3', AUTHENTICATE,
        async function (req, res) {
            let {database, collection, bucket, key} = req.body;
            await db.create_from_s3_csv(database, collection, bucket, key);
            res.send({success: true})
        });

    app.post('/data/aggregate', AUTHENTICATE,
        async function (req, res) {
            let {database, collection, aggregate} = req.body;
            console.log("aggregating")
            let data = await db.aggregate(database, collection, aggregate).then(cursor => cursor.toArray());
            res.send({success: true, data})
        });
}