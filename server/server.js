const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const bodyParser = require("body-parser");

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
if (!['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
    throw `process.env.NODE_ENV (${process.env.NODE_ENV}) must be 'development', 'production' or 'test'`
}

let dotenv_path = path.resolve(process.cwd(), "..", `.env.${process.env.NODE_ENV}`);
// if developing and `.env.development` doesn't exist, copy `.env.example`
if (process.env.NODE_ENV === "development" && !fs.existsSync(dotenv_path)) {
    let dotenv_example_path = path.resolve(process.cwd(), "..", `.env.example`);
    fs.copyFileSync(dotenv_example_path, dotenv_path)
}
require('dotenv').config({path: path.resolve(process.cwd(), "..", `.env.${process.env.NODE_ENV}`)});

if (process.env.NODE_ENV === 'development') {
    const webpack = require('webpack');
    const clientConfig = require('../client/webpack.config');

    // 1. client webpack watcher
    clientConfig.devtool = 'source-map';
    const clientCompiler = webpack(clientConfig);
    clientCompiler.watch({}, function(err, stats) {
        console.log('\n🔨 CLIENT UPDATED AT', new Date().toLocaleTimeString())
        if (err) {console.error(err); return;}
        console.log(stats.toString({chunks: false, colors: true}));
        console.log()
    });

    // 2. server webpack watcher
    const serverConfig = require('./webpack.config');
    serverConfig.devtool = 'source-map';
    const serverCompiler = webpack(serverConfig);
    serverCompiler.watch({}, function(err, stats) {
        console.log('\n🔨 SERVER UPDATED AT', new Date().toLocaleTimeString())
        if (err) {console.error(err); return;}
        console.log(stats.toString({chunks: false, colors: true}));
        Object.keys(require.cache).forEach(function(id) {
            if (/[\/\\]server[\/\\]/.test(id)) delete require.cache[id];
        });
        console.log();
    });
}

let port = parseInt(process.env.CLIENTSIDE_PORT);

let app = express();

let corsOptions = {origin: /:\/\/(localhost|127.0.0.1)(:\d+)?$/};
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// serve static assets
const STATIC = path.resolve(__dirname, '..', 'client', 'dist');
const INDEX = path.resolve(STATIC, 'index.html');
app.use(express.static(STATIC));

// load all endpoints
app.use(function(req, res, next) {
    require('./dist/router').app(req, res, next);
});

app.get('*', function (request, response) {
    response.sendFile(INDEX);
});

app.listen(port, '0.0.0.0', function () {
    console.log(`🚀 SERVER STARTED AT http://localhost:${port}.\n`);
});

