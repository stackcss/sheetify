const fromString = require('from2-string')
const stream = require('readable-stream')
const prefix = require('postcss-prefix')
const resolve = require('style-resolve')
const nodeResolve = require('resolve')
const mapLimit = require('map-limit')
const postcss = require('postcss')
const crypto = require('crypto')
const pump = require('pump')
const fs = require('fs')

module.exports = sheetify

function sheetify (filename, options, done) {
  if (typeof options === 'function') {
    done = options
    options = {}
  }

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

  const ws = new stream.PassThrough()
  transform(filename, src, options, function (err, src) {
    if (done) {
      ws.end()
      return done(err, src, id)
    }

    if (err) return ws.emit('error', err)
    const rs = fromString(src)
    pump(rs, ws)
  })

  return ws
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
    } else if (!Array.isArray(plugin)) {
      return done(new Error('Plugin must be a string or array'))
    }

    const name = plugin[0]
    const opts = plugin[1]

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
