const replace = require('rollup-plugin-replace')
const resolve = require('rollup-plugin-node-resolve')
const babel = require('rollup-plugin-babel')
const uglify = require('rollup-plugin-uglify')
const version = process.env.VERSION || require('./package.json').version

module.exports = {
  entry: 'src/index.js',
  dest: 'dist/ency.js',
  format: 'umd',
  moduleName: 'Ency',
  plugins: [
    replace({ __VERSION__: version }),
    resolve(),
    babel({
      exclude: 'node_modules/**' // only transpile our source code
    }),
    uglify()
  ],
  banner:
    `/**
      * ency v${version}
      * (c) ${new Date().getFullYear()} Alid Castano
      * @license MIT
      */`
}
