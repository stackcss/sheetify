var test = require('tape')
var exec = require('child_process').exec
var fs = require('fs')

var BIN = require.resolve('../bin.js')

var expected = fs.readFileSync(__dirname  + '/concat-expected.css', 'utf8')

test('works', function(t) {
  t.plan(2)

  exec(BIN + ' concat.css', {
    cwd: __dirname
  }, function(err, stdout, stderr) {
    t.ifError(err)
    t.equal(stdout.trim(), expected.trim())
  })
})
