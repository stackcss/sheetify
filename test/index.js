var sheetify = require('../sheetify')
var wrap = require('wrap-selectors')
var test = require('tape')
var fs = require('fs')

test('basic', function(t) {
  var expects = fs.readFileSync(__dirname + '/fixtures/basic-expected.css')
  var bundler = sheetify(__dirname + '/fixtures/basic.css')

  bundler.transform(function(file) {
    return function(ast, next) {
      next(null, wrap()(ast))
    }
  })

  bundler.bundle(function(err, output) {
    t.ifError(err, 'bundled without error')
    t.equal(String(expects).trim(), output.trim(), 'expected output')
    t.end()
  })
})

test('imports', function(t) {
  var expects = fs.readFileSync(__dirname + '/fixtures/imports-expected.css')
  var bundler = sheetify(__dirname + '/fixtures/imports.css')

  bundler.transform(function(file) {
    return function(ast, next) {
      next(null, wrap()(ast))
    }
  })

  bundler.bundle(function(err, output) {
    t.ifError(err, 'bundled without error')
    t.equal(String(expects).trim(), output.trim(), 'expected output')
    t.end()
  })
})
