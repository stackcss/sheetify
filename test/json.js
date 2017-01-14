var test = require('tape')
var join = require('path').join
var browserify = require('browserify')

var transform = require('../transform')

test('JSON files', function (t) {
  t.plan(2)

  browserify()
    .add(join(__dirname, 'fixtures', './example.json'))
    .transform(transform)
    .bundle(function (err, code) {
      if (err) return t.end(err)
      code = String(code)

      t.assert(code.includes('same'), 'preserves key')
      t.assert(code.includes('as it ever was'), 'preserves value')
    })
})
