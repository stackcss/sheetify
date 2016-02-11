const browserify = require('browserify')
const concat = require('concat-stream')
const test = require('tape')
const path = require('path')
const fs = require('fs')

const sheetify = require(path.join(__dirname, '../transform'))
const expath = require.resolve('css-type-base/index.css')
const expected = fs.readFileSync(expath, 'utf8').trim()

test('import', function (t) {
  t.plan(1)

  const ws = concat(function (buf) {
    const res = String(buf).trim()
    t.equal(res, expected, 'package was imported')
  })

  const bOpts = { browserField: false }
  const b = browserify(path.join(__dirname, 'import/source.js'), bOpts)
  b.transform(sheetify, {
    basedir: path.join(__dirname, 'plugins'),
    o: ws
  })

  const r = b.bundle()
  r.resume()
  r.on('end', function () {
    ws.end()
  })
})
