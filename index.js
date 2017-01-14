var cssPrefix = require('postcss-prefix')
var nodeResolve = require('resolve')
var mapLimit = require('map-limit')
var postcss = require('postcss')
var assert = require('assert')
var crypto = require('crypto')
var xtend = require('xtend')
var stackTrace = require('stack-trace')
var cssResolve = require('style-resolve').sync
var fs = require('fs')
var path = require('path')

module.exports = sheetify
module.exports.getPrefix = getPrefix

// transform css
// (str, str, obj?, fn) -> str
function sheetify (src, filename, options, done) {
  // handle tagged template calls directly from Node
  var isTemplate = Array.isArray(src)
  if (isTemplate) src = src.join('')
  assert.equal(typeof src, 'string', 'src must be a string')
  src = src.trim()

  // Ensure prefix is always correct when run from inside node
  var css
  if (!isTemplate && (!filename || typeof filename === 'object')) {
     // module or file name via tagged template call w or w/out options
    var callerDirname = path.dirname(stackTrace.get()[1].getFileName())
    var resolved = cssResolve(src, { basedir: callerDirname })
    css = fs.readFileSync(resolved, 'utf8')
  } else {
    // it better be some css
    css = src
  }

  var prefix = getPrefix(css)

  // only parse if in a browserify transform
  if (typeof filename === 'string') parseCss(src, filename, prefix, options, done)

  return prefix
}

function getPrefix (css) {
  var prefix = '_' + crypto.createHash('md5')
    .update(css.trim())
    .digest('hex')
    .slice(0, 8)
  return prefix
}

// parse css
// (str, str, str, obj, fn) -> null
function parseCss (src, filename, prefix, options, done) {
  assert.equal(typeof filename, 'string', 'filename must be a string')
  assert.equal(typeof prefix, 'string', 'prefix must be a string')
  assert.equal(typeof options, 'object', 'options must be a object')
  assert.equal(typeof done, 'function', 'done must be a function')

  applyTransforms(filename, String(src), xtend(options), function (err, css) {
    if (err) return done(err)
    var p = postcss()
    p = p.use(cssPrefix('.' + prefix))

    try {
      css = p.process(css).toString()

      return done(null, css, prefix)
    } catch (e) {
      return done(e)
    }
  })

  // apply transforms to a string of css,
  // one at the time
  // (str, str, obj, fn) -> null
  function applyTransforms (filename, src, options, done) {
    options.use = [].concat(options.use || []).concat(options.u || [])
    mapLimit(options.use, 1, iterate, function (err) {
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

      var name = plugin[0]
      var opts = plugin[1] || {}

      var resolveOpts = {
        basedir: opts.basedir || options.basedir || process.cwd()
      }
      nodeResolve(name, resolveOpts, function (err, transformPath) {
        if (err) return done(err)

        var transform = require(transformPath)
        transform(filename, src, opts, function (err, result) {
          if (err) return next(err)
          src = result
          next()
        })
      })
    }
  }
}
