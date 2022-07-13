import {
    CreateBucketCommand,
    GetObjectCommand,
    ListBucketsCommand,
    PutObjectCommand,
    S3Client
} from "@aws-sdk/client-s3";
import {Readable} from "stream";
import readline from "readline";
import {invokeCommand} from "../drivers/lambda";
import {TR_MONGO_DB_NAME} from "../constants";


export interface ReadS3CSV {
    bucket: string
    key: string
    reader_args?: object
}

function getS3Client(): S3Client {
    return new S3Client({
        endpoint: process.env.NODE_ENV === 'development' ? `http://${process.env.TR_S3_URI}` : undefined,
        region: process.env.AWS_REGION,
        forcePathStyle: true,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    })
}


export async function readHeaders(
    s3_info: ReadS3CSV
): Promise<string[]> {
    const s3Client = getS3Client();

    const response = await s3Client.send(new GetObjectCommand({Bucket: s3_info.bucket, Key: s3_info.key}));
    const readable = (response.Body as Readable)
    const reader = readline.createInterface({input: readable, terminal: false, crlfDelay: Infinity});

    for await (const line of reader) {
        // Each line in input will be successively available here as `line`.
        return line.split(",")
    }
}

export interface WriteS3CSV {
    bucket: string
    key: string
    reader_args?: object
}

export async function uploadToS3(
    s3_info: WriteS3CSV,
    file: Express.Multer.File
): Promise<void> {
    const s3Client = getS3Client();

    if ((await s3Client.send(new ListBucketsCommand({})))
        .Buckets.every(b => b.Name !== s3_info.bucket)) {
        await s3Client.send(new CreateBucketCommand({
            Bucket: s3_info.bucket,
            CreateBucketConfiguration: {LocationConstraint: process.env.AWS_REGION}
        }))
    }

    return await s3Client.send(new PutObjectCommand({
            Bucket: s3_info.bucket,
            Key: s3_info.key,
            Body: file.buffer,
            ACL: 'public-read',
            ContentType: file.mimetype,
        }))
        .then(() => undefined)
        .catch(err => console.log(err.stack));
}


interface RunQuery {
    collection_name: string,
    method: string,
    query: object[],
    comment: string,
    user: string
}

export async function runQuery(query_info: RunQuery): Promise<any> {
    return invokeCommand("mongo-client", {
        kind: "run_query",
        event: Object.assign({method: 'aggregate'}, query_info, {database_name: TR_MONGO_DB_NAME})
    })
}

interface WriteMongoCollection {
    database_name: string
    collection_name: string
    reload?: boolean
    indexes?: string[]
}

interface RunS3Import {
    s3: ReadS3CSV
    mongo: WriteMongoCollection
}

export async function runS3Import(query_info: RunS3Import): Promise<any> {
    return invokeCommand("mongo-client", {
        kind: "run_s3_import",
        event: Object.assign({method: 'aggregate'}, query_info, {database_name: TR_MONGO_DB_NAME})
    })
}