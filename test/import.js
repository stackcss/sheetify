var browserify = require('browserify')
var concat = require('concat-stream')
var through = require('through2')
var test = require('tape')
var path = require('path')
var fs = require('fs')

var sheetify = require(path.join(__dirname, '../transform'))

test('npm import', function (t) {
  t.test('should import npm packages', function (t) {
    t.plan(1)

    var expath = require.resolve('css-type-base/index.css')
    var expected = fs.readFileSync(expath, 'utf8').trim()

    var ws = concat(function (buf) {
      var res = String(buf).trim()
      t.equal(res, expected, 'package was imported')
    })

    var bOpts = { browserField: false }
    var bpath = path.join(__dirname, 'fixtures/import-source.js')
    browserify(bpath, bOpts)
      .transform(sheetify)
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

  t.test('should emit an error on broken import', function (t) {
    t.plan(1)

    var inpath = path.join(__dirname, 'fixtures/import-broken-source.js')
    var bOpts = { browserField: false }
    var b = browserify(inpath, bOpts)
    b.transform(sheetify)

    var r = b.bundle()
    r.resume()
    r.on('error', function (e) {
      t.ok(/Cannot find module/.test(e), 'emits an error')
    })
  })
})
