const sheetify = require('../')
const xtend = require('xtend')
const test = require('tape')
const path = require('path')
const fs = require('fs')

test('basic prefixing', compare('./index.css', 'index-out.css'))
test('basic prefixing', compare('./transformed.css', 'transformed-out.css', {
  use: [
    ['sheetify-cssnext', { sourcemap: false }]
  ]
}))

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
