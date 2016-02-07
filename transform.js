const mapLimit = require('map-limit')
const eos = require('end-of-stream')
const through = require('through2')
const falafel = require('falafel')
const mkdirp = require('mkdirp')
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

  // argv parsing
  if (opts.o) opts.out = opts.o
  if (opts.out) opts.out = path.resolve(opts.out)

  return through(write, end)

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
      if (err) return this.emit('error', err)
      self.push(ast.toString())
      self.push(null)
    })

    // asynchronously update css and apply to node
    // or exorcise to file
    function iterate (args, done) {
      const transform = args[0]
      const node = args[1]
      transform(function (err, css, prefix) {
        if (err) return done(err)
        if (opts.out) {
          // exorcise to external file
          const dirname = path.dirname(opts.out)
          mkdirp(dirname, function (err) {
            if (err) return done(err)
            const ws = fs.createWriteStream(opts.out)
            eos(ws, done)
            node.update('0')
            ws.end(css)
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
      const fnp = path.join(path.dirname(filename), node.arguments[0].value)
      const fnCss = fs.readFileSync(fnp, 'utf8').trim()
      sheetify(fnCss, filename, opts, function (tf) {
        nodes.push([ tf, node ])
      })
      return
    }
  }
}

function cooked (node) { return node.value.cooked }
function expr (ex) { return { _expr: ex.source() } }
