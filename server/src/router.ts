import * as express from "express";
// import 'source-map-support/register'

export const app = express.Router();

// forward-declare the process var that will hold environment variables
export declare var process: { env: any }


import {register_dataset_views} from "./dataset/views";
import {register_auth_views} from "./auth/views";
import {register_solver_views} from "./solver/views";
import {register_workspace_views} from "./workspace/views";

register_auth_views(app)
register_dataset_views(app)
register_solver_views(app)
register_workspace_views(app)
