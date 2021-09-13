// @ts-ignore
import supertest from "supertest";
const express = require('express');

const app = express();
app.use(function(req, res, next) {
    require('../../src/router').app(req, res, next);
});


describe("test login", () => {
    it("should log into the dev admin account", () => supertest(app)
        .post("/auth/login")
        .send({email: 'dev_admin@gmail.com', password: 'admin2394'})
        .expect(response => expect("data" in response.body)));
});