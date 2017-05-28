const browserify = require('browserify')
const concat = require('concat-stream')
const through = require('through2')
const test = require('tape')
const path = require('path')
const fs = require('fs')

const sheetify = require('../')

test('npm import', function (t) {
  t.test('should import npm packages', function (t) {
    t.plan(1)

    const expath = require.resolve('css-type-base/index.css')
    const expected = fs.readFileSync(expath, 'utf8').trim()

    const ws = concat(function (buf) {
      const res = String(buf).trim()
      t.equal(res, expected, 'package was imported')
    })

    const bOpts = { browserField: false }
    const bpath = path.join(__dirname, 'fixtures/import-source.js')
    browserify(bpath, bOpts)
      .transform(sheetify)
      .transform(function (file) {
        return through(function (buf, enc, next) {
          const str = buf.toString('utf8')
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

    const inpath = path.join(__dirname, 'fixtures/import-broken-source.js')
    const bOpts = { browserField: false }
    const b = browserify(inpath, bOpts)
    b.transform(sheetify)

    const r = b.bundle()
    r.resume()
    r.on('error', function (e) {
      t.ok(/Cannot find module/.test(e), 'emits an error')
    })
  })
})
