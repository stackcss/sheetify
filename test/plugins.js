const browserify = require('browserify')
const concat = require('concat-stream')
const test = require('tape')
const path = require('path')
const fs = require('fs')

const sheetify = require(path.join(__dirname, '../transform'))
const expath = path.join(__dirname, 'plugins/expected.css')
const expected = fs.readFileSync(expath, 'utf8').trim()

test('plugins', function (t) {
  t.plan(2)

  const b = browserify(path.join(__dirname, 'plugins/source.js'), {
    browserField: false
  })
  b.transform(sheetify, {
    basedir: path.join(__dirname, 'plugins'),
    use: [ [ 'sheetify-cssnext', { sourcemap: false } ] ],
    out: concat(function (buf) {
      const res = String(buf).trim()
      t.equal(res, expected, 'css is transformed')
    })
  })
  b.bundle(function (err) {
    t.ifError(err, 'no error')
  })
})
