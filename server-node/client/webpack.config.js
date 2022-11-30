const path = require('path');
const webpackConfig = require('webpack');

// populate process.env with .env.* keys
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
if (!['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
    throw `process.env.NODE_ENV (${process.env.NODE_ENV}) must be 'development', 'production' or 'test'`
}
require('dotenv').config({path: path.resolve(process.cwd(), "..", "..", `.env.${process.env.NODE_ENV}`)});

module.exports = {
    name: 'client',
    target: 'web',
    entry: {
        app: ['./client/src/js/index.ts'],
    },
    output: {
        filename: "index.js",
        path: path.resolve(__dirname, './client/dist'),
        publicPath: "/"
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
                    .filter(key => key.startsWith('CLIENTSIDE_'))
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
                test: /\.(js|ts)$/,
                exclude: /(node_modules)/,
                use: {loader: "swc-loader"}
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader',
                ],
            },
            {
                test: /\.png$/,
                type: 'asset/resource'
            }
        ],
    },
    devServer: {
        static: './client/dist',
        contentBase: path.join(__dirname, 'public'),
        stats: {colors: true},
        port: 3571,
        host: `localhost`,
    },
}