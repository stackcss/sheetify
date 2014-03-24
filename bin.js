#!/usr/bin/env node

var resolve = require('style-resolve')
var sheetify = require('./sheetify')
var subarg = require('subarg')
var path = require('path')
var fs = require('fs')

var argv = subarg(
  process.argv.slice(2)
)

convertAliases(argv, {
    t: 'transform'
  , c: 'compress'
  , v: 'version'
  , d: 'debug'
}, {
  transform: []
})

var files = argv._
files = files.map(String)
files = files.map(function(entry) {
  return /^\.\//g.test(entry)
    ? entry
    : './' + entry
})

if (!files.length) return help()

var bundler = sheetify(files)

argv.transform.forEach(function(tr) {
  bundler.transform(tr)
})

bundler.bundle({
    compress: argv.compress || false
  , debug: argv.debug || false
}, function(err, data) {
  if (err) throw err
  process.stdout.write(data)
  process.stdout.write('\n')
})

function help() {
  var $0 = path.basename(process.argv[1])
  var usage = fs.readFileSync(
    __dirname + '/usage.txt', 'utf8'
  )

  process.stdout.write(
    usage.replace(/\$0/g, $0)
  )
}

function convertAliases(argv, aliases, defaults) {
  Object.keys(aliases).forEach(function(alias) {
    var key = aliases[alias]

    if (key in argv) argv[key] = makeArray(argv[key])
    if (!(alias in argv)) return

    var value = makeArray(argv[alias])

    argv[key] = argv[key]
      ? value.concat(argv[key])
      : value

    delete argv[alias]
  })

  Object.keys(defaults).forEach(function(key) {
    if (key in argv) return
    argv[key] = defaults[key]
  })
}

function makeArray(value) {
  return Array.isArray(value)
    ? value
    :[value]
}
