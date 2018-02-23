'use strict';

const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

<<<<<<< Updated upstream
function isExternal(module) {
    var userRequest = module.userRequest;

    if (typeof userRequest !== 'string') {
        return false;
    }

    return userRequest.indexOf('bower_components') >= 0 ||
=======
function isExternal (module) {
  var userRequest = module.userRequest;
  if (typeof userRequest !== 'string') {
    return false;
  }
  return userRequest.indexOf('bower_components') >= 0 ||
>>>>>>> Stashed changes
        userRequest.indexOf('node_modules') >= 0 ||
        userRequest.indexOf('lib') >= 0;
}

module.exports = {
    entry: path.resolve(__dirname, 'public/app/app.js'),
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public/web/js')
    },
    resolve: {
        modules: ['node_modules', './public/lib'],
        extensions: ['.js', '.jsx', '.css', '.json']
    },
    module: {
        loaders: [{
            test: /\.js(x)?$/,
            exclude: /node_modules/,
            loaders: 'babel-loader',
            query: {
              presets: [ 'stage-2' ]
            }
        }, {
            test: /\.scss$/,
            loader: ExtractTextPlugin.extract('css-loader')
        }, {
            test: /\.css$/,
            loader: 'css-loader'
        }, {
            test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            loader: "url-loader?limit=10000&mimetype=application/font-woff"
        }, {
            test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            loader: "file-loader"
        }, {
            test: /\.svg(\?v=[0-9]\.[0-9]\.[0-9])?$/,
            loader: 'url-loader?limit=10000&mimetype=image/svg+xml&name=/images/[name].[ext]'
        }, {
            test: /\.(jpe?g|png|gif|ico|svg)$/i,
            loader: 'file-loader?name=/images/[name].[ext]'
        }, {
            test: /\.json$/,
            loader: 'json-loader'
        }]
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendors',
            minChunks: function (module) {
                return isExternal(module);
            },
            filename: 'vendors.js',
            path: path.resolve(__dirname, 'public/web/js')
        })
    ],
    watchOptions: {
        poll: true
    },
    node: {
        net: 'empty',
        tls: 'empty',
        dns: 'empty'
    }
};
