const browserify = require('browserify')
const test = require('tape')
const path = require('path')
const babelify = require('babelify')

const sheetify = require('..')

test('transpilers', function (t) {
  t.test('with babel', function (t) {
    t.plan(2)
    const bPath = path.join(__dirname, 'fixtures/prefix-inline-source.js')
    const bOpts = { browserField: false }
    browserify(bPath, bOpts)
      .transform(babelify)
      .transform(sheetify)
      .bundle(function (err, src) {
        t.error(err, 'no error')
        t.ok(src)
        console.log(src.toString())
      })
  })
})
