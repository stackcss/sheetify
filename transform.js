const mapLimit = require('map-limit')
const isStream = require('is-stream')
const eos = require('end-of-stream')
const through = require('through2')
const falafel = require('falafel')
const resolve = require('resolve')
const assert = require('assert')
const mkdirp = require('mkdirp')
const xtend = require('xtend')
const path = require('path')
const fs = require('fs')

const sheetify = require('./index')

module.exports = transform

// inline sheetify transform for browserify
// 1. walk AST
// 2. replace sheetify references with prefix id's
// 3. aggregate all transform calls
// 3. asynchronously either replace sheetify calls
//    with CSS injection or extract CSS to callback
// 4. flush transform
// obj -> (str, opts) -> str
function transform (filename, opts) {
  const bufs = []
  const nodes = []
  var mname = null

  opts = xtend(opts)

  // argv parsing
  if (opts.o) opts.out = opts.o
  if (opts.out) {
    if (typeof opts.out === 'string') opts.out = path.resolve(opts.out)
    else assert.ok(isStream(opts.out), 'opts.out must be a path or a stream')
  }

  const outStream = through(write, end)
  return outStream

  // aggregate all AST nodes
  // (buf, str, fn) -> null
  function write (buf, enc, next) {
    bufs.push(buf)
    next()
  }

  // parse and push AST nodes
  // null -> null
  function end () {
    const self = this
    const src = Buffer.concat(bufs).toString('utf8')
    const ast = falafel(src, { ecmaVersion: 6 }, walk)

    // transform all detected nodes and
    // close stream when done
    mapLimit(nodes, Infinity, iterate, function (err) {
      if (err) return self.emit('error', err)
      self.push(ast.toString())
      self.push(null)
    })

    // find sheetify call
    // - read from file, read from inline or resolve npm package
    // - detect if should be prefixed or not
    function iterate (args, done) {
      const transformFn = args[0]
      const node = args[1]
      transformFn(function (err, css, prefix) {
        if (err) return done(err)
        if (opts.out) {
          // exorcise to external file
          const dirname = path.dirname(opts.out)
          mkdirp(dirname, function (err) {
            if (err) return done(err)
            const ws = (typeof opts.out === 'string')
              ? fs.createWriteStream(opts.out)
              : opts.out
            eos(ws, done)
            node.update('0')
            ws.end(css)
            done()
          })
        } else {
          // inject CSS inline
          const str = [
            "((require('insert-css')(" + JSON.stringify(css) + ')',
            ' || true) && ' + JSON.stringify(prefix) + ')'
          ].join('')
          node.update(str)
          done()
        }
      })
    }
  }

  // transform an AST node
  // obj -> null
  function walk (node) {
    // transform require calls
    if (node.type === 'CallExpression' &&
    node.callee && node.callee.name === 'require' &&
    node.arguments.length === 1 &&
    node.arguments[0].value === 'sheetify') {
      node.update('0')
      mname = node.parent.id.name
      return
    }

    // transform template strings
    // modify node value to prefix, and push css for transform
    if (node.type === 'TemplateLiteral' &&
    node.parent && node.parent.tag &&
    node.parent.tag.name === mname) {
      const tmplCss = [ node.quasis.map(cooked) ]
        .concat(node.expressions.map(expr)).join('').trim()

      sheetify(tmplCss, filename, opts, function (tf) {
        nodes.push([ tf, node.parent ])
      })

      return
    }

    // transform call references into files read from disk
    // modify value node to prefix, and push css for transform
    if (node.type === 'CallExpression' &&
    node.callee && node.callee.type === 'Identifier' &&
    node.callee.name === mname) {
      // determine path
      // - check if module import
      // - don't prefix by default if module import
      // - check if local file
      const resolvePath = cssResolve(node.arguments[0].value, opts.basedir)
      const fnp = resolvePath ||
        path.join(path.dirname(filename), node.arguments[0].value)
      if (resolvePath) opts.global = true
      else outStream.emit('file', fnp)
      const fnCss = fs.readFileSync(fnp, 'utf8').trim()

      // read optional arguments passed in to node
      // e.g. { global: false }
      if (node.arguments[1] && node.arguments[1].properties) {
        const props = node.arguments[1].properties
        props.forEach(function (prop) {
          opts[prop.key.name] = prop.value.value
        })
      }

      sheetify(fnCss, fnp, opts, function (tf) {
        nodes.push([ tf, node ])
      })

      return
    }
  }
}

function cooked (node) { return node.value.cooked }
function expr (ex) { return { _expr: ex.source() } }

// find a file in CSS with either a {style} field
// or main with `.css` in it
// (str, str) -> str
function cssResolve (pkgname, basedir) {
  try {
    const res = resolve.sync(pkgname, {
      basedir: pkgname,
      packageFilter: packageFilter
    })

    if (path.extname(res) !== '.css') {
      throw new Error('path ' + res + ' is not a CSS file')
    }

    return res
  } catch (e) {
    return
  }

  function packageFilter (pkg, path) {
    if (pkg.style) pkg.main = pkg.style
    return pkg
  }
}
