const transform = require('../transform')
const from = require('from2-string')
const test = require('tape')

test('transform should not parse if sheetify is not in source', function (t) {
  from('THIS SYNTAX IS INVALID')
    .pipe(transform('test.js'))
    .once('error', function (error) {
      t.ifError(error, 'syntax error picked up; must\'ve parsed!')
      t.end()
    })
    .once('end', function () { t.end() })
    .resume()
})
