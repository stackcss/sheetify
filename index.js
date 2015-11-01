const prefix = require('postcss-prefix')
const resolve = require('style-resolve')
const nodeResolve = require('resolve')
const mapLimit = require('map-limit')
const postcss = require('postcss')
const crypto = require('crypto')
const fs = require('fs')

module.exports = sheetify

function sheetify (filename, options, done) {
  if (typeof options === 'function') {
    done = options
    options = {}
  }

  done = done || throwop
  options = options || {}

  filename = resolve.sync(filename, {
    basedir: options.basedir || process.cwd()
  })

  var src = fs.readFileSync(filename)
  var id = crypto.createHash('md5')
    .update(src)
    .digest('hex')
    .slice(0, 8)

  src = postcss()
    .use(prefix('.' + id + ' '))
    .process(src.toString())
    .toString()

  transform(filename, src, options, function (err, src) {
    return done(err, src, id)
  })

  return id
}

function throwop (err) {
  if (err) throw err
}

function transform (filename, src, options, done) {
  var use = options.use || []
  use = Array.isArray(use) ? use.slice() : [use]

  mapLimit(use, 1, iterate, function (err) {
    if (err) return done(err)
    done(null, src)
  })

  function iterate (plugin, next) {
    if (typeof plugin === 'string') {
      plugin = [plugin, {}]
    } else
    if (!Array.isArray(plugin)) {
      return done(new Error('Plugin must be a string or array'))
    }

    const name = plugin[0]
    const opts = plugin[1]

    nodeResolve(name, {
      basedir: opts.basedir || options.basedir
    }, function (err, transformPath) {
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
