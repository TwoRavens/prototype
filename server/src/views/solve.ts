import {Router} from "express";
import passport from "passport";
import {invoke_command} from "../drivers/lambda";

export function register_solve(app: Router) {

    app.post('/solve/search',
        passport.authenticate('jwt', {session: false}),
        async function (req, res) {
            console.log("received search request", req.user);
            let response = await invoke_command("solver-search")
            console.log(response);

            res.send({success: true})
        });
}
