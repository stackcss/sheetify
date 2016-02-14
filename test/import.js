const browserify = require('browserify')
const concat = require('concat-stream')
const test = require('tape')
const path = require('path')
const fs = require('fs')

const sheetify = require(path.join(__dirname, '../transform'))

test('import', function (t) {
  t.plan(1)

  const expath = require.resolve('css-type-base/index.css')
  const expected = fs.readFileSync(expath, 'utf8').trim()

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

test('broken import should emit an error', function (t) {
  t.plan(1)

  const inpath = path.join(__dirname, 'import/broken.js')

  const ws = concat(function (buf) {
    const res = String(buf).trim()
    console.log(res)
  })

  const bOpts = { browserField: false }
  const b = browserify(inpath, bOpts)
  b.transform(sheetify, {
    basedir: path.join(__dirname, 'plugins'),
    o: ws
  })

  const r = b.bundle()
  r.resume()
  r.on('error', function (e) {
    t.ok(/cannot be imported/.test(e), 'emits an error')
  })
  r.on('end', function () {
    ws.end()
  })
})
