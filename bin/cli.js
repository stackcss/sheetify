#!/usr/bin/env node
const cliclopts = require('cliclopts')
const minimist = require('minimist')
const pump = require('pump')
const path = require('path')
const util = require('util')
const fs = require('fs')

const pkg = require('../package.json')
const main = require('../')

const opts = cliclopts([
  {
    name: 'help',
    abbr: 'h',
    boolean: true
  },
  {
    name: 'version',
    abbr: 'v',
    boolean: true
  },
  {
    name: 'use',
    abbr: 'u'
  },
  {
    name: 'basedir',
    abbr: 'b'
  }
])

const argv = minimist(process.argv.slice(2), opts.options())

// parse options
if (argv.version) {
  const version = require('../package.json').version
  process.stdout.write('v' + version + '\n')
  process.exit(0)
} else if (argv.help) {
  process.stdout.write(pkg.name + ' - ' + pkg.description + '\n')
  usage(0)
} else if (!argv._.length) {
  process.stderr.write('Error: no target file specified\n')
  usage(1)
} else {
  const basedir = argv.basedir || process.cwd()
  const entryPoint = path.join(basedir, argv._[0])
  const plugins = Array.isArray(argv.use) ? argv.use : [ argv.use ]
  const mainOpts = { basedir: basedir }
  if (argv.use) mainOpts.use = plugins

  main(entryPoint, mainOpts, function (err, css) {
    if (err) process.stderr.write(util.format(err) + '\n')
    process.stdout.write(util.format(css).trim() + '\n')
    process.exit(err ? 1 : 0)
  })
}

// print usage & exit
// num? -> null
function usage (exitCode) {
  const rs = fs.createReadStream(__dirname + '/usage.txt')
  const ws = process.stdout
  pump(rs, ws, process.exit.bind(null, exitCode))
}
