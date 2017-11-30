var resolve = require('path').resolve,
    webpack = require('webpack'),
    merge = require('webpack-merge'),
    HtmlWebpackPlugin = require('html-webpack-plugin')

const projectRoot = resolve(__dirname, './')
const srcRoot = resolve(__dirname, './src')
const testRoot = resolve(__dirname, './test')
const devRoot = resolve(__dirname, './dev')
const prodRoot = resolve(__dirname, './dist')

const baseConfig = {
  resolve: {
    extensions: ['.js'],
    alias: {
      'src': srcRoot,
      'dev': devRoot,
      'util': resolve(__dirname, './util')
    },
    modules: [
      srcRoot, "node_modules"
    ]
  },
  module: {
    rules: [
      {
        test: /\.(js|vue)$/,
        loader: 'eslint-loader',
        enforce: "pre",
        include: [srcRoot, testRoot],
        options: {
          formatter: require('eslint-friendly-formatter')
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        include: projectRoot
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      }
    ]
  }
}

const devConfig = {
  entry: `${srcRoot}/index.js`,
  output: {
    publicPath: '/'
  },
  devtool: '#eval-source-map',
  performance: { hints: false },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"development"'
      }
    })
    // ,
    // new webpack.optimize.OccurrenceOrderPlugin(),
    // new webpack.HotModuleReplacementPlugin(),
    // new webpack.NoEmitOnErrorsPlugin()
    // ,
    // new HtmlWebpackPlugin({
    //   template: `${devRoot}/index.html`,
    //   inject: true
    // })
  ]
}

// const prodConfig = {
//   entry: `${srcRoot}/index.js`,
//   output: {
//     path: prodRoot,
//     publicPath: '/dist/',
//     filename: 'build.js',
//     library: 'ency',
//     libraryTarget: 'umd'
//   },
//   externals: {
//     vue: 'vue'
//   },
//   devtool: '#source-map',
//   plugins: (baseConfig.plugins || []).concat([
//     new webpack.DefinePlugin({
//       'process.env': {
//         NODE_ENV: '"production"'
//       }
//     }),
//     new webpack.optimize.UglifyJsPlugin({
//       sourceMap: true,
//       compress: {
//         warnings: false
//       }
//     }),
//     new webpack.LoaderOptionsPlugin({
//       minimize: true
//     })
//   ])
// }

var finalConfig

if (process.env.NODE_ENV === 'development') {
  finalConfig = merge(baseConfig, devConfig)
}
else if (process.env.NODE_ENV === 'production') {
  finalConfig = merge(baseConfig, prodConfig)
}
else if (process.env.NODE_ENV === 'testing') {
  finalConfig = merge(baseConfig, testConfig)
  // no need for original entry during tests
  delete finalConfig.entry
}
else {
  throw 'Node environment does not exist'
}

module.exports = finalConfig
