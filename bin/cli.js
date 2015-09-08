#!/usr/bin/env node
const cliclopts = require('cliclopts')
const minimist = require('minimist')
const fs = require('fs')

const main = require('../')

const opts = cliclopts([
  { name: 'help', abbr: 'h', boolean: true },
  { name: 'version', abbr: 'v', boolean: true },
  { name: 'compress', abbr: 'c', boolean: true },
  { name: 'debug', abbr: 'd', boolean: true },
  { name: 'transform', abbr: 't' }
])

const argv = minimist(process.argv.slice(2), opts.options())
const files = argv._.map(function (file) {
  const entry = String(file)
  return /^\.\//g.test(entry) ? entry : './' + entry
})

// parse options
if (argv.version) {
  const version = require('../package.json').version
  process.stdout.write('v' + version)
  process.exit(0)
}
else if (argv.help) usage(0)
else if (!files.length) usage(1)
else {
  const bundler = main(files[0])

  const transforms = toArray(argv.transform)
  transforms.forEach(function (tr) {
    bundler.transform(tr)
  })

  bundler.bundle(argv, function (err, data) {
    if (err) throw err
    process.stdout.write(data)
    process.stdout.write('\n')
  })
}

// print usage & exit
// num? -> null
function usage (exitCode) {
  fs.createReadStream(__dirname + '/usage.txt')
    .pipe(process.stdout)
    .on('close', process.exit.bind(null, exitCode))
}

// transform a value to an array
// [any]|any -> [any]
function toArray (val) {
  if (!val) return []
  return Array.isArray(val) ? val : [val]
}
