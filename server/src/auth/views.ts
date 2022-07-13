import {Router} from "express";
import passport from "passport"
import {ExtractJwt, Strategy as JwtStrategy} from "passport-jwt";
import {body, validationResult} from "express-validator";
import jwt from 'jsonwebtoken';
import {config} from "../config";
import * as db from "../drivers/mongo";
import {user_validate} from "../drivers/mongo";
import * as constants from '../constants';
import {asyncHandler, Option} from '../constants';

export interface User {
    email: string
}

// define how to map from the unencrypted jwt payload to a user account
passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.passport.secret
}, async (payload: any, done) =>
    db.user_read(payload.email)
        .then(user => done(null, (user ? {email: user.email} : null) as Option<User>))
        .catch(err => done(err, false))));


const registerValidation = () => [
    body('email')
        .exists().withMessage(constants.EMAIL_IS_EMPTY)
        .isEmail().withMessage(constants.EMAIL_IS_INVALID),
    body('password')
        .exists().withMessage(constants.PASSWORD_IS_EMPTY)
        .isLength({min: 8}).withMessage(constants.PASSWORD_LENGTH_MUST_BE_MORE_THAN_8),
];
const loginValidation = () => [
    body('email')
        .exists().withMessage(constants.EMAIL_IS_EMPTY)
        .isEmail().withMessage(constants.EMAIL_IS_INVALID),
    body('password')
        .exists().withMessage(constants.PASSWORD_IS_EMPTY)
        .isLength({min: 8}).withMessage(constants.PASSWORD_LENGTH_MUST_BE_MORE_THAN_8),
];

export function register_auth_views(app: Router) {
    app.use(passport.initialize());

    app.post('/auth/register',
        registerValidation(),
        asyncHandler(async function (req, res, next) {
            const errorsAfterValidation = validationResult(req);
            if (!errorsAfterValidation.isEmpty()) {
                return res.send({success: false, data: errorsAfterValidation.mapped()});
            }
            let {email, password} = req.body;
            // let {email, password} = req.body;
            await db.user_create(email, password);

            const token = jwt.sign({email}, config.passport.secret,
                {expiresIn: config.passport.expiresIn,});
            res.send({success: true, data: token})
        }));

    // login using jwt
    app.post('/auth/login',
        loginValidation(),
        asyncHandler(async function (req, res) {
            const errorsAfterValidation = validationResult(req);
            if (!errorsAfterValidation.isEmpty()) {
                return res.send({success: false, data: errorsAfterValidation.mapped()});
            }
            const {email, password} = req.body;
            await user_validate(email, password);

            const token = jwt.sign({email}, config.passport.secret,
                {expiresIn: config.passport.expiresIn,});
            res.send({success: true, data: token});
        }));
}
