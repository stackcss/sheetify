const test = require('tape')
const path = require('path')
const fs = require('fs')

const sheetify = require('..')

test('returns a prefix in node for a file', function (t) {
  t.plan(1)

  const inroute = path.join(__dirname, 'server/source.css')
  const infile = fs.readFileSync(inroute, 'utf8')

  const prefix = sheetify(infile)
  t.ok(/_[\w]{7}/.test(prefix), 'prefix is ok')
})

test('returns a prefix in node for a tagged template', function (t) {
  t.plan(1)
  const prefix = sheetify`
    h1 {}
    h1.title {}
  `
  t.ok(/_[\w]{7}/.test(prefix), 'prefix is ok')
})
