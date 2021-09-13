import {Router} from "express";
import passport from "passport"
import {ExtractJwt, Strategy as JwtStrategy} from "passport-jwt";
import * as db from '../drivers/mongo';
import {check, validationResult} from "express-validator";
import jwt from 'jsonwebtoken';
import {config} from "../config";
import {user_validate} from "../drivers/mongo";
import * as constants from '../constants';

const registerValidation = [
    check('email')
        .exists().withMessage(constants.EMAIL_IS_EMPTY)
        .isEmail().withMessage(constants.EMAIL_IS_INVALID),
    check('password')
        .exists().withMessage(constants.PASSWORD_IS_EMPTY)
        .isLength({min: 8}).withMessage(constants.PASSWORD_LENGTH_MUST_BE_MORE_THAN_8),
];
const loginValidation = [
    check('email')
        .exists().withMessage(constants.EMAIL_IS_EMPTY)
        .isEmail().withMessage(constants.EMAIL_IS_INVALID),
    check('password')
        .exists().withMessage(constants.PASSWORD_IS_EMPTY)
        .isLength({min: 8}).withMessage(constants.PASSWORD_LENGTH_MUST_BE_MORE_THAN_8),
];

// define how to map from the unencrypted jwt payload to a user account
passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.passport.secret
}, async (payload, done) =>
    db.user_read(payload.email)
        .then(user => done(null, user ? {email: user.email} : false))
        .catch(err => done(err, false))));

export function register_user(app: Router) {
    app.use(passport.initialize());

    app.post('/auth/register', registerValidation, async function (req, res, next) {
        const errorsAfterValidation = validationResult(req);
        if (!errorsAfterValidation.isEmpty()) {
            return res.send({success: false, errors: errorsAfterValidation.mapped(),});
        }
        let {email, password} = req.body;
        await db.user_create(email, password);

        const token = jwt.sign({email}, config.passport.secret,
            {expiresIn: config.passport.expiresIn,});
        res.send({success: true, data: token})
    });

    // login using jwt
    app.post('/auth/login', loginValidation, async function (req, res) {
        const errorsAfterValidation = validationResult(req);
        if (!errorsAfterValidation.isEmpty()) {
            return res.send({success: false, errors: errorsAfterValidation.mapped(),});
        }

        const { email, password } = req.body;
        await user_validate(email, password);

        const token = jwt.sign({ email }, config.passport.secret,
            {expiresIn: config.passport.expiresIn,});
        res.send({success: true, data: token});
    });
}
