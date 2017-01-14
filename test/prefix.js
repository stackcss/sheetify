var browserify = require('browserify')
var concat = require('concat-stream')
var through = require('through2')
var test = require('tape')
var path = require('path')
var fs = require('fs')
var vm = require('vm')
var cssResolve = require('style-resolve').sync

var transform = require('../transform')
var sheetify = require('..')

test('prefix', function (t) {
  t.test('should return a prefix when called in Node', function (t) {
    t.plan(1)
    var prefix = sheetify`.foo { color: blue; }`
    var expected = sheetify.getPrefix('.foo { color: blue; }')
    t.equal(prefix, expected, 'prefix is equal')
  })

  t.test('should return a prefix with relative path in Node', function (t) {
    t.plan(1)
    var expath = path.join(__dirname, 'fixtures/prefix-import-source.css')
    var expected = sheetify.getPrefix(fs.readFileSync(expath, 'utf8'))
    var prefix = sheetify('./fixtures/prefix-import-source.css')
    t.equal(prefix, expected, 'prefix is equal')
  })

  t.test('should return a prefix with a module name in Node', function (t) {
    t.plan(1)
    var expath = cssResolve('css-wipe')
    var expected = sheetify.getPrefix(fs.readFileSync(expath, 'utf8'))
    var prefix = sheetify('css-wipe')
    t.equal(prefix, expected, 'prefix is equal')
  })

  t.test('should prefix and inline template strings', function (t) {
    t.plan(3)

    var expath = path.join(__dirname, 'fixtures/prefix-inline-expected.css')
    var expected = fs.readFileSync(expath, 'utf8').trim()

    var ws = concat(function (buf) {
      var res = String(buf).trim()
      t.equal(res, expected, 'css is equal')
    })

    var bOpts = { browserField: false }
    var bpath = path.join(__dirname, 'fixtures/prefix-inline-source.js')
    browserify(bpath, bOpts)
      .transform(transform)
      .transform(function (file) {
        return through(function (buf, enc, next) {
          var str = buf.toString('utf8')
          this.push(str.replace(/sheetify\/insert/, 'insert-css'))
          next()
        })
      })
      .plugin('css-extract', { out: outFn })
      .bundle(parseBundle)

    function outFn () {
      return ws
    }

    function parseBundle (err, src) {
      t.ifError(err, 'no error')
      var c = { console: { log: log } }
      vm.runInNewContext(src.toString(), c)

      function log (msg) {
        t.equal(msg, '_f918f624', 'echoes prefix')
      }
    }
  })

  t.test('should prefix and inline imported files', function (t) {
    t.plan(3)

    var expath = path.join(__dirname, 'fixtures/prefix-import-expected.css')
    var expected = fs.readFileSync(expath, 'utf8').trim()

    var ws = concat(function (buf) {
      var res = String(buf).trim()
      t.equal(res, expected, 'css is equal')
    })

    var bOpts = { browserField: false }
    var bpath = path.join(__dirname, 'fixtures/prefix-import-source.js')
    browserify(bpath, bOpts)
      .transform(transform)
      .transform(function (file) {
        return through(function (buf, enc, next) {
          var str = buf.toString('utf8')
          this.push(str.replace(/sheetify\/insert/, 'insert-css'))
          next()
        })
      })
      .plugin('css-extract', { out: outFn })
      .bundle(parseBundle)

    function outFn () {
      return ws
    }

    function parseBundle (err, src) {
      t.ifError(err, 'no error')
      var c = { console: { log: log } }
      vm.runInNewContext(src.toString(), c)

      function log (msg) {
        t.equal(msg, '_f918f624', 'echoes prefix')
      }
    }
  })
})
