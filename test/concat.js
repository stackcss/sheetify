var exec = require('child_process').exec
var test = require('tape')
var fs = require('fs')

var BIN = require.resolve('../bin/cli.js')
var expected = fs.readFileSync(__dirname + '/concat-expected.css', 'utf8')

test('works', function (t) {
  t.plan(2)
  const opts = { cwd: __dirname }
  exec(BIN + ' concat.css', opts, function (err, stdout, stderr) {
    t.ifError(err)
    t.equal(stdout.trim(), expected.trim())
  })
})
