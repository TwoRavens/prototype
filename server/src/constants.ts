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


export const EMAIL_IS_EMPTY = 'EMAIL_IS_EMPTY';
export const PASSWORD_IS_EMPTY = 'PASSWORD_IS_EMPTY';
export const PASSWORD_LENGTH_MUST_BE_MORE_THAN_8 = 'PASSWORD_LENGTH_MUST_BE_MORE_THAN_8';
export const WRONG_PASSWORD = 'WRONG_PASSWORD';
export const USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS';
export const USER_DOES_NOT_EXIST = 'USER_DOES_NOT_EXIST';
export const TOKEN_IS_EMPTY = 'TOKEN_IS_EMPTY';
export const EMAIL_IS_INVALID = 'EMAIL_IS_INVALID';

export const AUTHENTICATE = passport.authenticate('jwt', {session: false});

// Explicitly handle errors in the promise of async request handlers via the next function
export const asyncHandler = (fn: RequestHandler) =>
    (req: Request, res: Response, next: NextFunction) =>
        Promise.resolve(fn(req, res, next)).catch(next);
