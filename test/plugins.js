const browserify = require('browserify')
const concat = require('concat-stream')
const through = require('through2')
const test = require('tape')
const path = require('path')
const fs = require('fs')

const sheetify = require('../')

test('plugins', function (t) {
  t.test('should transform CSS', function (t) {
    t.plan(1)

    const expath = path.join(__dirname, 'fixtures/plugins-expected.css')
    const expected = fs.readFileSync(expath, 'utf8').trim()

    const ws = concat(function (buf) {
      const res = String(buf).trim()
      t.equal(res, expected, 'CSS was transformed')
    })

    const bOpts = { browserField: false }
    const bpath = path.join(__dirname, 'fixtures/plugins-source.js')
    browserify(bpath, bOpts)
      .transform(sheetify, {
        use: [ [ 'sheetify-cssnext', { sourcemap: false } ] ]
      })
      .transform(function (file) {
        return through(function (buf, enc, next) {
          const str = buf.toString('utf8')
          this.push(str.replace(/sheetify\/insert/g, 'insert-css'))
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
