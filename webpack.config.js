/**
 * Created by happy on 07.06.2017.
 */

const path = require('path');
const webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

const config = {
    entry: './static/js/script.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env'],
                        compact: true
                    }
                }
            },
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallbackLoader: 'style-loader',
                    loader: ['css-loader'],
                    publicPath: '/dist'
                })
            }
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jquery: 'jquery',
            'window.jQuery': 'jquery',
            jQuery: 'jquery'
        }),
        new ExtractTextPlugin({
            filename: 'bundle.css',
            disable: false,
            allChunks: true
        })
    ],
    devtool: 'source-map',
    /*watch: true,
     watchOptions: {
     aggregateTimeout: 300,
     poll: 1000
     },*/
};

module.exports = config;