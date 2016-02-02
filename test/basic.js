const test = require('tape')
const path = require('path')
const fs = require('fs')

const sheetify = require('../')

test('basic prefixing', function (t) {
  t.plan(1)

  const route = path.join(__dirname, 'fixtures', 'index-out.css')
  const expected = fs.readFileSync(route, 'utf8')

  const opts = { basedir: path.join(__dirname, 'fixtures') }
  sheetify('./index.css', opts, function (err, actual) {
    if (err) return t.error(err, 'no error')
    t.equal(actual, expected, 'output is as expected')
  })
})

test('basic prefixing', function (t) {
  t.plan(1)

  const route = path.join(__dirname, 'fixtures', 'index-out.css')
  const expected = fs.readFileSync(route, 'utf8')

  const opts = {
    basedir: path.join(__dirname, 'fixtures'),
    use: [[ 'sheetify-cssnext', { sourcemap: false } ]]
  }
  sheetify('./index.css', opts, function (err, actual) {
    if (err) return t.error(err, 'no error')
    t.equal(actual, expected, 'output is as expected')
  })
})
