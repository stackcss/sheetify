const fs = require('fs')
const browserify = require('browserify')
const test = require('tape')
const path = require('path')
const concat = require('concat-stream')
const through = require('through2')
const babelify = require('babelify')

const sheetify = require('..')

test('transpilers', function (t) {
  t.test('with babel', function (t) {
    t.plan(2)

    const expath = path.join(__dirname, 'fixtures/prefix-inline-expected.css')
    const expected = fs.readFileSync(expath, 'utf8').trim()

    const ws = concat(function (buf) {
      const res = String(buf).trim()
      t.equal(res, expected, 'css is equal')
    })

    function outFn () {
      return ws
    }

    const bPath = path.join(__dirname, 'fixtures/prefix-inline-source.js')
    const bOpts = { browserField: false }
    browserify(bPath, bOpts)
      .transform(babelify)
      .transform(sheetify)
      .transform(function (file) {
        return through(function (buf, enc, next) {
          const str = buf.toString('utf8')
          this.push(str.replace(/sheetify\/insert/, 'insert-css'))
          next()
        })
      })
      .plugin('css-extract', { out: outFn })
      .bundle(function (err, src) {
        t.error(err, 'no error')
      })
  })
})
