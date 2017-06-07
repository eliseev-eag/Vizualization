/**
 * Created by happy on 07.06.2017.
 */

const path = require('path');
const webpack = require('webpack');

const config = {
    entry: './static/js/script.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jquery: 'jquery',
            'window.jQuery': 'jquery',
            jQuery: 'jquery'
        })
    ],
    module: {
        rules: [
            {test: /\.(js|jsx)$/, use: 'babel-loader'}
        ]
    },
    devtool: 'cheap-eval-source-map'
};

module.exports = config;