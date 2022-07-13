import {
    AggregationCursor,
    Collection, Db, DeleteOptions, DeleteResult,
    Document, Filter, FindOneAndUpdateOptions, InsertOneOptions,
    ModifyResult, MongoClient,
    ObjectId, UpdateOptions, UpdateResult
} from "mongodb";
import * as crypto from "crypto";
import {TR_MONGO_CORE_DB_NAME, USER_ALREADY_EXISTS, USER_DOES_NOT_EXIST, UserError, WRONG_PASSWORD} from "../constants";

let mongoClientPromise = MongoClient.connect(`mongodb://${process.env.TR_MONGO_URI}`);

class MongoError extends Error {
    verbatim?: Document
    constructor(err) {
        super(err.errmsg);
        this.name = "MongoError";
        this.verbatim = err;
    }
}

async function getCoreDb(): Promise<Db> {
    return (await mongoClientPromise).db(TR_MONGO_CORE_DB_NAME)
}

export async function getCoreCollection(collection: string): Promise<Collection> {
    return (await getCoreDb()).collection(collection)
}
export async function aggregate(collection: string, aggregate: Document[]): Promise<AggregationCursor> {
    return (await getCoreCollection(collection)).aggregate(aggregate)
}

export async function insertOne(collectionName: string, doc: Document, options: InsertOneOptions=null): Promise<ObjectId> {
    let collection = await getCoreCollection(collectionName);
    let result = await collection.insertOne(doc, options);
    return result.insertedId;
}

export async function updateOne(collectionName: string, filter: Filter<Document>, update: any, options: FindOneAndUpdateOptions=null): Promise<Document> {
    let collection = await getCoreCollection(collectionName);
    let result: ModifyResult = await collection.findOneAndUpdate(filter, update, options);
    if (!result.ok) throw new MongoError(result.lastErrorObject)
    return result.value;
}

export async function updateMany(collectionName: string, filter: Filter<Document>, update: any, options: UpdateOptions=null): Promise<UpdateResult | Document> {
    let collection = await getCoreCollection(collectionName);
    return await collection.updateMany(filter, update, options);
}

export async function deleteOne(collectionName: string, filter: Filter<Document>, options: DeleteOptions=null): Promise<DeleteResult> {
    let collection = await getCoreCollection(collectionName);
    return await collection.deleteOne(filter, options);
}

export async function deleteMany(collectionName: string, filter: Filter<Document>, options: DeleteOptions=null): Promise<DeleteResult> {
    let collection = await getCoreCollection(collectionName);
    return await collection.deleteMany(filter, options);
}


export async function first(cursor, errMsg="Failed to match a result."): Promise<any> {
    let doc = await cursor.next();
    if (!doc) {throw new UserError(errMsg)}
    return doc
}

export async function firstUser(cursor) {
    return first(cursor, "Unrecognized user id.")
}



// USER ACCOUNTS
export async function user_create(email: string, password: string): Promise<void> {
    let salt = crypto.randomBytes(16);
    let hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256').toString("base64");
    let users = await getCoreCollection('users');

    if (await users.findOne({email}) !== null)
        throw new UserError({email: {msg: USER_ALREADY_EXISTS}});
    await users.insertOne({email, hashedPassword, salt: salt.toString("base64")});
}

export async function user_read(email: string): Promise<any> {
    let users = await getCoreCollection('users');
    return await users.findOne({email})
}

export async function user_validate(email: string, password: string): Promise<any> {
    let user = await user_read(email);
    if (!user) throw new UserError({email: {msg: USER_DOES_NOT_EXIST}});

    let hashedPassword = crypto.pbkdf2Sync(password, Buffer.from(user.salt, "base64"), 10000, 32, 'sha256');
    if (!crypto.timingSafeEqual(Buffer.from(user.hashedPassword, "base64"), hashedPassword)) {
        throw new UserError({password: {msg: WRONG_PASSWORD}});
    }

    // only return allowed keys
    return {email: user.email, workspaces: user.workspaces ?? []}
}