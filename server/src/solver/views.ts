import {Request, Router} from "express";
import {invokeCommand} from "../drivers/lambda";
import {asyncHandler, AUTHENTICATE} from "../constants";

export function register_solver_views(app: Router) {

    app.post('/solve/search', AUTHENTICATE,
        asyncHandler(async (req, res, next) => {
            console.log("received search request", req.user);
            let response = await invokeCommand("solver-search")
            console.log(response);
            res.send({success: true})
        }));

    app.post('/rook', AUTHENTICATE,
        asyncHandler(async (req: Request, res) => {
            console.log("received r request 2", req.user, req.body);
            try {
                let response = await invokeCommand<any>("rook", req.body)
                console.log(response);
                res.send({success: true, data: response})
            } catch (err) {
                console.log("errored", err)

                res.send({success: false, data: err})
            }
        }));
}
