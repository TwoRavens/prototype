const path = require('path');
const fs = require('fs');
const webpackConfig = require('webpack');

// populate process.env with .env.* keys
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

require('dotenv').config({path: dotenv_path});

module.exports = {
    name: 'server',
    target: 'node',
    entry: {
        app: ['./src/router.ts'],
    },
    output: {
        filename: "router.js",
        path: path.resolve(__dirname, 'dist'),
        publicPath: "/",
        libraryTarget: 'commonjs'
    },
    watchOptions: {
        ignored: '/node_modules/',
    },
    mode: process.env.NODE_ENV,
    plugins: [
        // inject environment variables
        new webpackConfig.DefinePlugin({
            process: {
                env: Object.keys(process.env)
                    .reduce((obj, key) => Object.assign(obj, {[key]: JSON.stringify(process.env[key])}), {})
            }
        }),
    ],
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {presets: ['@babel/preset-env']},
                },
            },
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    externals: [ /^(?![.\/]).+/i, ],
    devServer: {
        static: './dist/',
        stats: {colors: true},
        port: 3572,
        host: `localhost`,
    },
}
