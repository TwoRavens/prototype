import * as express from "express";

export const app = express.Router();

// forward-declare the process var that will hold environment variables
export declare var process: { env: any }


import {register_data} from "./views/data";
import {register_user} from "./views/user";
import {register_solve} from "./views/solve";

register_data(app)
register_user(app)
register_solve(app)