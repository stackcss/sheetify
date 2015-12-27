const stream = require('readable-stream')
const pump = require('pump')
const callerPath = require('caller-path')
const dirname = require('path').dirname

const sheetify = require('./')

module.exports = sheetifyStream

// return a sheetify stream
// (str, obj) -> rstream
function sheetifyStream (path, opts) {
  opts = opts || {}

  // default basedir option to
  // path of module that called this module
  opts.basedir = opts.basedir || dirname(callerPath())

  const pts = new stream.PassThrough()

  // force async to prevent weird race conditions
  process.nextTick(function () {
    sheetify(path, opts, function (err, css) {
      if (err) return pts.emit('error', err)

      const ln = css.length
      var i = 0

      const rs = new stream.Readable({
        read: function (n) {
          if (i >= ln) return this.push(null)
          this.push(css.slice(i, n))
          i += n
        }
      })

      pump(rs, pts)
    })
  })

  return pts
}
