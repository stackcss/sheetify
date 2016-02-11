const browserify = require('browserify')
const concat = require('concat-stream')
const rimraf = require('rimraf')
const test = require('tape')
const path = require('path')
const fs = require('fs')
const vm = require('vm')

const sheetify = require(path.join(__dirname, '../transform'))
const expectpath = path.join(__dirname, 'exorcise/expected.css')
const outpath = path.join('..', 'tmp/exorcise.bundle.css')

test('exorcise to disk', function (t) {
  t.plan(4)

  const b = browserify(path.join(__dirname, 'exorcise/source.js'), {
    browserField: false
  })

  b.transform(sheetify, {
    basedir: path.join(__dirname, 'transform'),
    o: outpath
  })

  b.bundle(function (err, src) {
    t.ifError(err, 'no error')
    const c = { console: { log: log } }
    vm.runInNewContext(src.toString(), c)

    function log (msg) {
      t.equal(msg, 0, 'empty message')
      const expected = fs.readFileSync(expectpath, 'utf8')
      const outfile = fs.readFileSync(outpath, 'utf8')

      t.equal(outfile, expected, 'output matches')

      rimraf(path.dirname(outpath), function (err) {
        t.ifError(err, 'no error')
      })
    }
  })
})

test('exorcise to stream', function (t) {
  t.plan(1)

  const b = browserify(path.join(__dirname, 'exorcise/source.js'), {
    browserField: false
  })

  const ws = concat(function (buf) {
    const result = String(buf)
    const expected = fs.readFileSync(expectpath, 'utf8')
    t.equal(result, expected, 'exorcised to stream')
  })

  b.transform(sheetify, {
    basedir: path.join(__dirname, 'transform'),
    o: ws
  })

  const r = b.bundle()
  r.resume()
  r.on('end', function () {
    ws.end()
  })
})
