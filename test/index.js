const concat = require('concat-stream')
const test = require('tape')
const path = require('path')
const fs = require('fs')

const sheetify = require('../')

test('should do basic prefixing', function (t) {
  t.plan(2)

  const route = path.join(__dirname, 'fixtures', 'index-out.css')
  const expected = fs.readFileSync(route, 'utf8')
  const opts = { basedir: path.join(__dirname, 'fixtures') }

  const inFile = path.join(__dirname, 'fixtures', 'index.css')
  sheetify(inFile, opts, function (err, actual) {
    t.error(err, 'no error')
    t.equal(actual, expected, 'output is as expected')
  })
})

test('should use plugins', function (t) {
  t.plan(2)

  const route = path.join(__dirname, 'fixtures', 'transformed-out.css')
  const expected = fs.readFileSync(route, 'utf8')
  const opts = {
    basedir: path.join(__dirname, 'fixtures'),
    use: [ ['sheetify-cssnext', { sourcemap: false }] ]
  }

  const inFile = path.join(__dirname, 'fixtures', 'transformed.css')
  sheetify(inFile, opts, function (err, actual) {
    t.error(err, 'no error')
    t.equal(actual, expected, 'output is as expected')
  })
})

test('should return a stream', function (t) {
  t.plan(1)

  const route = path.join(__dirname, 'fixtures', 'index-out.css')
  const expected = fs.readFileSync(route, 'utf8')
  const opts = { basedir: path.join(__dirname, 'fixtures') }

  const inFile = path.join(__dirname, 'fixtures', 'index.css')
  sheetify(inFile, opts).pipe(concat(function (buf) {
    const str = String(buf)
    t.equal(str, expected, 'output is as expected')
  }))
})
