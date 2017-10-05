const browserify = require('browserify')
const concat = require('concat-stream')
const through = require('through2')
const test = require('tape')
const path = require('path')
const fs = require('fs')

const sheetify = require('../')

test('transform-package', function (t) {
  t.test('should transform CSS from package.json with options', function (t) {
    t.plan(1)

    const expath = path.join(__dirname, 'fixtures/transform-package/expected.css')
    const expected = fs.readFileSync(expath, 'utf8').trim()

    const ws = concat(function (buf) {
      const res = String(buf).trim()
      t.equal(res, expected, 'CSS was transformed')
    })

    const bpath = path.join(__dirname, 'fixtures/transform-package/source.js')

    browserify(bpath)
      .transform(sheetify)
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
