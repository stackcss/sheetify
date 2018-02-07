const browserify = require('browserify')
const subarg = require('subarg')
const concat = require('concat-stream')
const through = require('through2')
const test = require('tape')
const path = require('path')
const fs = require('fs')

const sheetify = require('../')

test('plugins', function (t) {
  t.test('should transform CSS', function (t) {
    t.plan(1)

    const expath = path.join(__dirname, 'fixtures/plugins-expected.css')
    const expected = fs.readFileSync(expath, 'utf8').trim()

    const ws = concat(function (buf) {
      const res = String(buf).trim()
      t.equal(res, expected, 'CSS was transformed')
    })

    const bOpts = { browserField: false }
    const bpath = path.join(__dirname, 'fixtures/plugins-source.js')
    browserify(bpath, bOpts)
      .transform(sheetify, {
        transform: [ [ 'sheetify-cssnext', { sourcemap: false } ] ]
      })
      .transform(function (file) {
        return through(function (buf, enc, next) {
          const str = buf.toString('utf8')
          this.push(str.replace(/sheetify\/insert/g, 'insert-css'))
          next()
        })
      })
      .plugin('css-extract', { out: outFn })
      .bundle()

    function outFn () {
      return ws
    }
  })

  t.test('should support subarg syntax', function (t) {
    const bpath = path.join(__dirname, 'fixtures/plugins-source.js')
    const bOpts = { browserField: false }
    const sTransform = require.resolve('./fixtures/simple-plugin')
    const args = subarg([ '--transform', '[', sTransform, '--replace', '.test{}', ']' ])
    browserify(bpath, bOpts)
      .transform(sheetify, args)
      .exclude('sheetify/insert')
      .bundle()
      .pipe(concat(function (bundle) {
        t.notEqual(bundle.indexOf(`require('sheetify/insert')(".test{}")`), -1)
        t.end()
      }))
  })

  t.test('should emit \'file\' events if transform included more files', function (t) {
    const bpath = path.join(__dirname, 'fixtures/plugins-source.js')
    const bOpts = { browserField: false }
    const expectedFiles = [
      bpath,
      '/path/to/included/file.css'
    ]
    const actualFiles = []
    browserify(bpath, bOpts)
      .transform(sheetify, {
        transform: [
          [ require.resolve('./fixtures/files-plugin'), {
            file: '/path/to/included/file.css'
          } ]
        ]
      })
      .exclude('sheetify/insert')
      .on('file', onfile)
      .on('transform', ontransform)
      .bundle(function (err, result) {
        t.ifError(err)
        t.deepEqual(actualFiles.sort(), expectedFiles.sort())
        t.end()
      })

    function onfile (filename) {
      if (actualFiles.indexOf(filename) === -1) {
        actualFiles.push(filename)
      }
    }
    function ontransform (tr) {
      tr.on('file', onfile)
    }
  })
})
