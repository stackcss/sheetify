const concat = require('concat-stream')
const xtend = require('xtend')
const test = require('tape')
const path = require('path')
const fs = require('fs')

const sheetifyStream = require('../stream')
const sheetify = require('../')

test('basic prefixing', compare('./index.css', 'index-out.css'))
test('basic prefixing', compare('./transformed.css', 'transformed-out.css', {
  use: [
    ['sheetify-cssnext', { sourcemap: false }]
  ]
}))

test('sheetify stream', function (t) {
  t.plan(1)
  const dir = path.join(__dirname, 'fixtures')
  const opts = { basedir: dir }
  sheetifyStream('./index.css', opts)
    .pipe(concat(function (buf) {
      const css = String(buf)
      const expected = fs.readFileSync(path.join(dir, 'index-out.css'), 'utf8')
      t.equal(css, expected, 'output is equal')
    }))
})

function compare (inputFile, expectedFile, opts) {
  opts = xtend({
    basedir: path.join(__dirname, 'fixtures')
  }, opts || {})

  return function compareTest (t) {
    const route = path.join(__dirname, 'fixtures', expectedFile)
    const expected = fs.readFileSync(route, 'utf8')

    t.plan(1)

    sheetify(inputFile, opts, function (err, actual) {
      if (err) return t.error(err, 'no error')

      t.equal(actual, expected, 'output is as expected')
    })
  }
}
