var browserify = require('browserify')
var concat = require('concat-stream')
var through = require('through2')
var test = require('tape')
var path = require('path')
var fs = require('fs')

var sheetify = require(path.join(__dirname, '../transform'))

test('plugins', function (t) {
  t.test('should transform CSS', function (t) {
    t.plan(1)

    var expath = path.join(__dirname, 'fixtures/plugins-expected.css')
    var expected = fs.readFileSync(expath, 'utf8').trim()

    var ws = concat(function (buf) {
      var res = String(buf).trim()
      t.equal(res, expected, 'CSS was transformed')
    })

    var bOpts = { browserField: false }
    var bpath = path.join(__dirname, 'fixtures/plugins-source.js')
    browserify(bpath, bOpts)
      .transform(sheetify, {
        use: [ [ 'sheetify-cssnext', { sourcemap: false } ] ]
      })
      .transform(function (file) {
        return through(function (buf, enc, next) {
          var str = buf.toString('utf8')
          this.push(str.replace(/sheetify\/insert/, 'insert-css'))
          next()
        })
      })
      .plugin('css-extract', { out: outFn })
      .bundle()

    function outFn () {
      return ws
    }
  })
})
