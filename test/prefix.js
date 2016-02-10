const browserify = require('browserify')
const concat = require('concat-stream')
const test = require('tape')
const path = require('path')
const fs = require('fs')

const sheetify = require(path.join(__dirname, '../transform'))

test('test global prefix', function (t) {
  t.plan(2)

  const b = browserify(path.join(__dirname, 'prefix/global-true.js'), {
    browserField: false
  })

  b.transform(sheetify, {
    basedir: path.join(__dirname, 'transform'),
    o: concat(function (buf) {
      const result = String(buf).trim()
      const expectpath = path.join(__dirname, 'prefix/source.css')
      const expected = fs.readFileSync(expectpath, 'utf8').trim()
      t.equal(result, expected, 'exorcised to stream')
    })
  })

  b.bundle(function (err, src) {
    t.ifError(err, 'no error')
  })
})
