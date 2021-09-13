import {AggregationCursor, Document, MongoClient} from "mongodb";
import {Readable} from "stream";
import csv from 'csv-parser';
import * as fs from 'fs';
import * as crypto from "crypto";
import {GetObjectCommand, S3Client} from "@aws-sdk/client-s3";

const mongodb_uri = process.env.MONGODB_URI;

export async function delete_(database: string, collection: string): Promise<void> {
    const client = await MongoClient.connect(mongodb_uri);
    await client.db(database).collection(collection).drop();
}

export async function create_from_csv(database: string, collection: string, data_path: string): Promise<void> {
    const client = await MongoClient.connect(mongodb_uri);
    fs.createReadStream(data_path).pipe(csv())
        .on('data', v => client.db(database).collection(collection).insertOne(v))
}

export async function create_from_s3_csv(
    database: string, collection: string,
    bucket: string, key: string
): Promise<void> {
    const mongoClient = await MongoClient.connect(mongodb_uri);
    const s3Client = new S3Client({
        region: "us-east-1",
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    });

    const bucketParams = {Bucket: bucket, Key: key,};
    const response = await s3Client.send(new GetObjectCommand(bucketParams));
    (response.Body as Readable).pipe(csv())
        .on('data', v => mongoClient.db(database).collection(collection).insertOne(v))
}

export async function aggregate(database: string, collection: string, aggregate: Document[]): Promise<AggregationCursor> {
    const client = await MongoClient.connect(mongodb_uri);
    return client.db(database).collection(collection).aggregate(aggregate);
}



// USER ACCOUNTS
export async function user_create(email: string, password: string): Promise<void> {
    let salt = crypto.randomBytes(16);
    let hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256').toString("base64");
    const client = await MongoClient.connect(mongodb_uri);
    if (await client.db('core').collection('users').findOne({email}) !== null) {
        throw "user already exists"
    }
    await client.db('core').collection('users')
        .insertOne({email, hashedPassword, salt: salt.toString("base64")});
}

export async function user_read(email: string): Promise<any> {
    const client = await MongoClient.connect(mongodb_uri);
    return await client.db('core').collection('users').findOne({email})
}

export async function user_validate(email: string, password: string): Promise<any> {
    let user = await user_read(email);
    if (!user) {
        throw 'Incorrect email or password.';
    }

    let hashedPassword = crypto.pbkdf2Sync(password, Buffer.from(user.salt, "base64"), 10000, 32, 'sha256');
    if (!crypto.timingSafeEqual(Buffer.from(user.hashedPassword, "base64"), hashedPassword)) {
        throw 'Incorrect email or password.';
    }

    // only return allowed keys
    return {email: user.email}
}