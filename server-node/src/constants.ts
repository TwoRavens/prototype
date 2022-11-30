import passport from "passport";
import {NextFunction, Request, RequestHandler, Response} from "express";

export interface Ok<T> {
    success: true,
    data: T
}

export interface Err<E> {
    success: false,
    data: E
}

export type Result<T, E> = Ok<T> | Err<E>;
export type Option<T> = T | null;

export const TR_S3_BUCKET_NAME = process.env.TR_S3_BUCKET_NAME;
export const TR_MONGO_DB_NAME = process.env.TR_MONGO_DB_NAME;
export const TR_MONGO_CORE_DB_NAME = "core";

export const EMAIL_IS_EMPTY = 'Email is empty.';
export const PASSWORD_IS_EMPTY = 'Password is empty.';
export const PASSWORD_LENGTH_MUST_BE_MORE_THAN_8 = 'Password has less than eight characters.';
export const WRONG_PASSWORD = 'Wrong password.';
export const USER_ALREADY_EXISTS = 'User already exists.';
export const USER_DOES_NOT_EXIST = 'User does not exist.';
export const EMAIL_IS_INVALID = 'Email is invalid.';

export const AUTHENTICATE = passport.authenticate('jwt', {session: false});

// User errors are automatically returned to the user and displayed in UI.
export class UserError extends Error {
    verbatim: any;
    constructor(err) {
        super(err);
        this.name = "UserError";
        this.verbatim = err;
    }
}

export const errorHandler = (res: Response, next: NextFunction) => err => {
    // redirect non-user errors to console.
    if (err.name !== 'UserError') {
        if (err.name === "LambdaError") console.error(err.pretty())
        else console.error(rewriteError(err));
    }
    res.send({
        success: false,
        data: err.name === 'UserError'
            ? err.verbatim
            : 'Unspecified error.' + (process.env.CLIENTSIDE_PRODUCTION !== "true" ? " See server logs." : "")
    });
    next()
}

const rewriteError = err => {
    // an ugly kludge, but errors now point to source code
    let stack: String = err.stack.replace("dist/webpack:/tworavens-server/", "");
    let lines = stack.split('\n')
    let regen_idx = lines.findIndex(l => l.includes("node_modules/regenerator-runtime"))
    return lines.slice(0, regen_idx).join('\n')
}

export const callbackHandler = (res: Response, next: NextFunction, cb) => err =>
    Promise.resolve(cb(err)).catch(errorHandler(res, next));

// Explicitly handle errors in the promise of async request handlers via the next function
export const asyncHandler = (fn: RequestHandler) =>
    (req: Request, res: Response, next: NextFunction) =>
        Promise.resolve(fn(req, res, next)).catch(errorHandler(res, next));
