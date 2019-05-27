
const fs = require('fs')
const browserify = require('browserify')
const test = require('tape')
const path = require('path')
const through = require('through2')
const babelify = require('babelify')
const bubleify = require('bubleify')

const sheetify = require('..')

test('transpiled code cleanup', function (t) {
  t.test('with babel', function (t) {
    t.test('compound var statement', function (t) {
      t.plan(2)

      bundle(
        path.join(__dirname, 'fixtures/cleanup-var-compound.js'),
        'babel',
        function (err, src) {
          t.error(err, 'no error')
          const expected = readFile(path.join(__dirname, 'fixtures/cleanup-var-compound-expected-babel.js'))
          t.equal(src, expected, 'js equal')
        }
      )
    })

    t.test('simple var statement', function (t) {
      t.plan(2)

      bundle(
        path.join(__dirname, 'fixtures/cleanup-var-simple.js'),
        'babel',
        function (err, src) {
          t.error(err, 'no error')
          const expected = readFile(path.join(__dirname, 'fixtures/cleanup-var-simple-expected-babel.js'))
          t.equal(src, expected, 'js equal')
        }
      )
    })
  })

  t.test('with buble', function (t) {
    t.test('compound var statement', function (t) {
      t.plan(2)

      bundle(
        path.join(__dirname, 'fixtures/cleanup-var-compound.js'),
        'buble',
        function (err, src) {
          t.error(err, 'no error')
          const expected = readFile(path.join(__dirname, 'fixtures/cleanup-var-compound-expected-buble.js'))
          t.equal(src, expected, 'js equal')
        }
      )
    })

    t.test('simple var statement', function (t) {
      t.plan(2)

      bundle(
        path.join(__dirname, 'fixtures/cleanup-var-simple.js'),
        'buble',
        function (err, src) {
          t.error(err, 'no error')
          const expected = readFile(path.join(__dirname, 'fixtures/cleanup-var-simple-expected-buble.js'))
          t.equal(src, expected, 'js equal')
        }
      )
    })
  })
})

function bundle (path, compiler, cb) {
  var bfy = browserify(path, { browserField: false })
  if (compiler === 'babel') bfy.transform(babelify, { presets: ['env'] })
  if (compiler === 'buble') bfy.transform(bubleify, { transforms: { dangerousTaggedTemplateString: true } })

  bfy
    .transform(sheetify)
    .transform(function (file) {
      return through(function (buf, enc, next) {
        const str = buf.toString('utf8')
        this.push(str.replace(/sheetify\/insert/g, 'insert-css'))
        next()
      })
    })
    .bundle(function (err, src) {
      cb(err, String(src).trim('\n'))
    })
}

function readFile (path) {
  return fs.readFileSync(path, 'utf8').trim('\n')
}
