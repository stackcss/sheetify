const staticModule = require('static-module')
const fromString = require('from2-string')
const stream = require('readable-stream')
const xtend = require('xtend/mutable')
const resolve = require('resolve')
const path = require('path')
const pump = require('pump')

const sheetify = require('./')

module.exports = transform

// inline sheetify transform for browserify
// (str, opts) -> str
function transform (filename, options) {
  const basedir = path.dirname(filename)
  const vars = {
    __filename: filename,
    __dirname: basedir,
    require: { resolve: resolver }
  }

  options = options || {}
  if (options.vars) xtend(vars, options.vars)

  const smOpts = { vars: vars, varModules: { path: path } }
  const sm = staticModule({ sheetify: staticSheetify }, smOpts)

  return sm

  // replace an inline sheetify require statement
  // with a hash and attach css to top of the bundle
  // (str, obj) -> rstream
  function staticSheetify (sheetFilename, sheetOptions) {
    sheetOptions = sheetOptions || {}
    sheetOptions.basedir = sheetOptions.basedir || basedir

    const pts = stream.PassThrough()

    sheetify(sheetFilename, sheetOptions, function (err, css, uuid) {
      if (err) { return sm.emit('error', err) }

      const sheetStream = fromString([
        "((require('insert-css')(" + JSON.stringify(css) + ')',
        ' || true) && ',
        JSON.stringify(uuid),
        ')'
      ].join(''))

      pump(sheetStream, pts)
      sm.emit('file', path.join(basedir, sheetFilename))
    })

    return pts
  }

  // resolve a path
  // str -> str
  function resolver (p) {
    return resolve.sync(p, { basedir: path.dirname(filename) })
  }
}
