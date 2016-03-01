const cssPrefix = require('postcss-prefix')
const nodeResolve = require('resolve')
const mapLimit = require('map-limit')
const postcss = require('postcss')
const assert = require('assert')
const crypto = require('crypto')

module.exports = sheetify

// transform css
// (str, str, obj?, fn) -> str
function sheetify (src, filename, options, push) {
  // handle tagged template calls directly from Node
  if (Array.isArray(src)) src = src.join('')
  assert.equal(typeof src, 'string', 'src must be a string')

  const prefix = '_' + crypto.createHash('md5')
    .update(src)
    .digest('hex')
    .slice(0, 8)

  // only parse if in a browserify transform
  if (filename) parseCss(src, filename, prefix, options, push)

  return prefix
}

// parse css
// (str, str, str, obj, fn) -> null
function parseCss (src, filename, prefix, options, next) {
  assert.equal(typeof filename, 'string', 'filename must be a string')
  assert.equal(typeof prefix, 'string', 'prefix must be a string')
  assert.equal(typeof options, 'object', 'options must be a object')
  assert.equal(typeof next, 'function', 'done must be a function')

  var p = postcss()
  if (options.global !== true) p = p.use(cssPrefix('.' + prefix))

  const processedCss = p
    .process(src.toString())
    .toString()

  next(function (done) {
    applyTransforms(filename, processedCss, options, function (err, css) {
      return done(err, css, prefix)
    })
  })

  // apply transforms to a string of css,
  // one at the time
  // (str, str, obj, fn) -> null
  function applyTransforms (filename, src, options, done) {
    options.u = options.u || []
    options.use = options.use || []
    var use = [].concat(options.use).concat(options.u)

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
}
