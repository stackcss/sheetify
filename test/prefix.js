const browserify = require('browserify')
const concat = require('concat-stream')
const test = require('tape')
const path = require('path')
const fs = require('fs')

const sheetify = require(path.join(__dirname, '../transform'))

test('test global prefix', function (t) {
  t.plan(1)

  const ws = concat(function (buf) {
    const result = String(buf).trim()
    const expectpath = path.join(__dirname, 'prefix/source.css')
    const expected = fs.readFileSync(expectpath, 'utf8').trim()
    t.equal(result, expected, 'exorcised to stream')
  })

  const bOpts = { browserField: false }
  const b = browserify(path.join(__dirname, 'prefix/global-true.js'), bOpts)
  b.transform(sheetify, {
    basedir: path.join(__dirname, 'prefix'),
    o: ws
  })

  const r = b.bundle()
  r.resume()
  r.on('end', function () {
    ws.end()
  })
})
