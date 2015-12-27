const browserify = require('browserify')
const jsdom = require('jsdom')
const test = require('tape')
const path = require('path')

const sheetify = require(path.join(__dirname, '../transform'))

test('transform', function (t) {
  t.plan(3)

  const b = browserify(path.join(__dirname, 'transform/source.js'), {
    browserField: false
  })
  b.transform(sheetify, { basedir: path.join(__dirname, 'transform') })
  b.bundle(function (err, src) {
    t.ifError(err, 'no error')

    const virtualConsole = jsdom.createVirtualConsole()
    virtualConsole.on('log', function (log) {
      t.equal(log, '_b9e94bdb', 'reports prefix')
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
