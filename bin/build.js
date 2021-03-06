#!/usr/bin/env node
var path = require('path')
var argv = require('yargs').option('config', { alias: 'c', string: true, requiresArg: true }).argv;
var webpack = require('webpack')

var exposedLibraries = ['react', 'react-dom', 'superagent', 'react-list', 'bluebird', 'socket.io-client', 'filesaver.js-npm']

var defaultConfig = {
  devtool: 'hidden-source-map',
  entry: {
    main: './studio/main_dev'
  },
  output: {
    filename: './studio/main.js'
  },
  externals: [
    function (context, request, callback) {
      if (/babel-runtime/.test(request)) {
        return callback(null, 'Studio.runtime[\'' + request.substring('babel-runtime/'.length) + '\']')
      }

      if (exposedLibraries.indexOf(request) > -1) {
        return callback(null, 'Studio.libraries[\'' + request + '\']')
      }

      if (request === 'jsreport-studio') {
        return callback(null, 'Studio')
      }

      callback()
    }
  ],
  module: {
    loaders: [
      { test: /\.json$/, loader: 'json-loader' },
      {
        test: /.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: [
            require.resolve('babel-preset-es2015'),
            require.resolve('babel-preset-react'),
            require.resolve('babel-preset-stage-0')
          ]
        }
      },
      {
        test: /\.scss$/,
        loader: 'style!css?modules&importLoaders=2&sourceMap&localIdentName=[local]___[hash:base64:5]!postcss-loader!sass?outputStyle=expanded&sourceMap'
      }
    ]
  },
  postcss: function () {
    return [
      require('postcss-flexbugs-fixes'),
      require('autoprefixer')
    ]
  },
  resolveLoader: {
    modulesDirectories: [
      'node_modules', 'node_modules/jsreport-studio-dev/node_modules'
    ]
  },
  resolve: {
    modulesDirectories: [
      'node_modules', 'node_modules/jsreport-studio-dev/node_modules'
    ]
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      },
      __DEVELOPMENT__: false
    })
    //
    // // optimizations
    // new webpack.optimize.DedupePlugin(),
    // new webpack.optimize.OccurenceOrderPlugin(),
    // new webpack.optimize.UglifyJsPlugin({
    //   compress: {
    //     warnings: false
    //   }
    // })
  ]
}

var config

if (argv.config) {
  console.log('using custom webpack config at:', argv.config)

  try {
    config = require(path.resolve(process.cwd(), argv.config))
  } catch (e) {
    throw new Error('Error while trying to use config in ' + argv.config + ' : ' e.message)
  }
} else {
  config = defaultConfig
}

webpack(config, function (err, stats) {
  if (err) {
    console.err(err)
    return process.exit(1)
  }

  var jsonStats = stats.toJson()

  if (jsonStats.errors.length > 0) {
    console.error(jsonStats.errors)
    process.exit(1)
  }

  console.log(stats.toString({ colors: true, chunks: true, cached: false }))

  console.log('webpack build ok')
})
