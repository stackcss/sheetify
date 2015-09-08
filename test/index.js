const wrap = require('wrap-selectors')
const test = require('tape')
const fs = require('fs')

const sheetify = require('..')

test('basic', function (t) {
  const expects = fs.readFileSync(__dirname + '/fixtures/basic-expected.css')
  const bundler = sheetify(__dirname + '/fixtures/basic.css')

  bundler.transform(function (file) {
    return function (ast, next) {
      next(null, wrap()(ast))
    }
  })

  bundler.bundle(function (err, output) {
    t.ifError(err, 'bundled without error')
    t.equal(String(expects).trim(), output.trim(), 'expected output')
    t.end()
  })
})

test('imports', function (t) {
  const expects = fs.readFileSync(__dirname + '/fixtures/imports-expected.css')
  const bundler = sheetify(__dirname + '/fixtures/imports.css')

  bundler.transform(function (file) {
    return function (ast, next) {
      next(null, wrap()(ast))
    }
  })

  bundler.bundle(function (err, output) {
    t.ifError(err, 'bundled without error')
    t.equal(String(expects).trim(), output.trim(), 'expected output')
    t.end()
  })
})
