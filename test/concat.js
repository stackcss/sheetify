const exec = require('child_process').exec
const test = require('tape')
const fs = require('fs')

const BIN = require.resolve('../bin/cli.js')
const expected = fs.readFileSync(__dirname + '/concat-expected.css', 'utf8')

test('works', function (t) {
  t.plan(2)
  const opts = { cwd: __dirname }
  exec(BIN + ' concat.css', opts, function (err, stdout, stderr) {
    t.ifError(err)
    t.equal(stdout.trim(), expected.trim())
  })
})
