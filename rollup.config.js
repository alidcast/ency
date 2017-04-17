const replace = require('rollup-plugin-replace')
const resolve = require('rollup-plugin-node-resolve')
const babel = require('rollup-plugin-babel')
const uglify = require('rollup-plugin-uglify')
const filesize = require('rollup-plugin-filesize')
const version = process.env.VERSION || require('./package.json').version

module.exports = {
  entry: 'src/index.js',
  dest: 'dist/build.js',
  format: 'umd',
  moduleName: 'Ency',
  external (id) { // modules that should remain external 
    if (/babel-runtime\/.*/i.test(id)) return true
  },
  plugins: [
    replace({ __VERSION__: version }),
    babel({
      exclude: 'node_modules/**', // only transpile our source code
      runtimeHelpers: true
    }),
    resolve(),
    uglify(),
    filesize()
  ],
  banner:
    `/**
      * ency v${version}
      * (c) ${new Date().getFullYear()} Alid Castano
      * @license MIT
      */`
}
