const callerPath = require('caller-path')
const prefix = require('postcss-prefix')
const resolve = require('style-resolve')
const nodeResolve = require('resolve')
const mapLimit = require('map-limit')
const postcss = require('postcss')
const crypto = require('crypto')
const path = require('path')
const fs = require('fs')

module.exports = sheetify

// transform css
// (str, obj?, fn)
function sheetify (filename, options, done) {
  if (typeof options === 'function') {
    done = options
    options = {}
  }

  done = done || throwop
  options = options || {}

  // default basedir option to
  // path of module that called this module
  options.basedir = options.basedir || path.dirname(callerPath())

  filename = resolve.sync(filename, { basedir: options.basedir })

  var src = fs.readFileSync(filename)
  var id = '_' + crypto.createHash('md5')
    .update(src)
    .digest('hex')
    .slice(0, 8)

  const processedCss = postcss()
    .use(prefix('.' + id))
    .process(src.toString())
    .toString()

  applyTransforms(filename, processedCss, options, function (err, src) {
    return done(err, src, id)
  })

  return id
}

// throw-if-error stub
// err? -> null
function throwop (err) {
  if (err) throw err
}

// apply transforms to a string of css,
// one at the time
// (str, str, obj, fn) -> null
function applyTransforms (filename, src, options, done) {
  var use = options.use || []
  use = Array.isArray(use) ? use.slice() : [ use ]

  mapLimit(use, 1, iterate, function (err) {
    if (err) return done(err)
    done(null, src)
  })

  // find and apply a transform to a string of css
  // (fn, fn) -> null
  function iterate (plugin, next) {
    if (typeof plugin === 'string') {
      plugin = [ plugin, {} ]
    } else if (!Array.isArray(plugin)) {
      return done(new Error('Plugin must be a string or array'))
    }

    const name = plugin[0]
    const opts = plugin[1] || {}

    const resolveOpts = { basedir: opts.basedir || options.basedir }
    nodeResolve(name, resolveOpts, function (err, transformPath) {
      if (err) return done(err)

      const transform = require(transformPath)
      transform(filename, src, opts, function (err, result) {
        if (err) return next(err)
        src = result
        next()
      })
    })
  }
}
