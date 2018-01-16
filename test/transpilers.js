const fs = require('fs')
const browserify = require('browserify')
const test = require('tape')
const path = require('path')
const concat = require('concat-stream')
const through = require('through2')
const babelify = require('babelify')
const bubleify = require('bubleify')

const sheetify = require('..')

test('transpilers', function (t) {
  const exPath = path.join(__dirname, 'fixtures/prefix-inline-expected.css')
  const bPath = path.join(__dirname, 'fixtures/prefix-inline-source.js')
  const expected = fs.readFileSync(exPath, 'utf8').trim()
  const bOpts = { browserField: false }

  t.test('with babel', function (t) {
    t.plan(2)

    const ws = concat(function (buf) {
      const res = String(buf).trim()
      t.equal(res, expected, 'css is equal')
    })

    function outFn () {
      return ws
    }

    browserify(bPath, bOpts)
      .transform(babelify, { presets: ['env'] })
      .transform(sheetify)
      .transform(function (file) {
        return through(function (buf, enc, next) {
          const str = buf.toString('utf8')
          this.push(str.replace(/sheetify\/insert/, 'insert-css'))
          next()
        })
      })
      .plugin('css-extract', { out: outFn })
      .bundle(function (err, src) {
        t.error(err, 'no error')
      })
  })

  t.test('with buble', function (t) {
    t.plan(2)

    const ws = concat(function (buf) {
      const res = String(buf).trim()
      t.equal(res, expected, 'css is equal')
    })

    function outFn () {
      return ws
    }

    browserify(bPath, bOpts)
      .transform(bubleify, { transforms: { dangerousTaggedTemplateString: true } })
      .transform(sheetify)
      .transform(function (file) {
        return through(function (buf, enc, next) {
          const str = buf.toString('utf8')
          this.push(str.replace(/sheetify\/insert/, 'insert-css'))
          next()
        })
      })
      .plugin('css-extract', { out: outFn })
      .bundle(function (err, src) {
        t.error(err, 'no error')
      })
  })
})
