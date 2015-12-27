const browserify = require('browserify')
const jsdom = require('jsdom')
const test = require('tape')
const path = require('path')

const sheetify = require(path.join(__dirname, '../transform'))

test('plugins', function (t) {
  t.plan(3)

  const b = browserify(path.join(__dirname, 'plugins/source.js'), {
    browserField: false
  })
  b.transform(sheetify, {
    basedir: path.join(__dirname, 'plugins'),
    use: [ [ 'sheetify-cssnext', { sourcemap: false } ] ]
  })
  b.bundle(function (err, src) {
    t.ifError(err, 'no error')

    const virtualConsole = jsdom.createVirtualConsole()
    virtualConsole.on('log', function (log) {
      t.equal(log, '_08548a3e', 'reports prefix')
    })

    jsdom.env({
      html: '<body></body>',
      src: [ String(src) ],
      done: world,
      virtualConsole: virtualConsole
    })

    function world (err, window) {
      t.ifError(err, 'no error')
    }
  })
})
