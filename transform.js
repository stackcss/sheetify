const cssResolve = require('style-resolve').sync
const staticEval = require('static-eval')
const mapLimit = require('map-limit')
const through = require('through2')
const falafel = require('falafel')
const xtend = require('xtend')
const path = require('path')
const fs = require('fs')

const sheetify = require('./index')

module.exports = transform

// inline sheetify transform for browserify
// obj -> (str, opts) -> str
function transform (filename, options) {
  if (/\.json$/i.test(filename)) return through()

  const opts = xtend(options || {
    basedir: process.cwd(),
    use: [],
    out: ''
  })

  opts.use = [].concat(opts.use || []).concat(opts.u || [])

  const bufs = []
  const transformStream = through(write, end)
  return transformStream

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

    // cool, you've made it this far. We know this is gross,
    // but tough times call for tough measure. Please don't
    // judge us too harshly, we'll work on perf ✨soon✨ -yw
    const nodes = []
    const src = Buffer.concat(bufs).toString('utf8')
    var mname = null
    var ast

    if (src.indexOf('sheetify') === -1) {
      self.push(src)
      self.push(null)
      return
    }

    try {
      const tmpAst = falafel(src, { ecmaVersion: 6 }, identifyModuleName)
      ast = falafel(tmpAst.toString(), { ecmaVersion: 6 }, extractNodes)
    } catch (err) {
      return self.emit('error', err)
    }

    // transform all detected nodes and
    // close stream when done
    mapLimit(nodes, Infinity, iterate, function (err) {
      if (err) return self.emit('error', err)
      self.push(ast.toString())
      self.push(null)
    })

    function identifyModuleName (node) {
      if (mname) return
      if (node.type === 'CallExpression' &&
      node.callee && node.callee.name === 'require' &&
      node.arguments.length === 1 &&
      node.arguments[0].value === 'sheetify') {
        node.update('0')
        mname = node.parent.id.name
      }
    }

    function extractNodes (node) {
      extractTemplateNodes(node)
      extractImportNodes(node)
    }

    function extractTemplateNodes (node) {
      if (node.type !== 'TemplateLiteral') return
      if (!node.parent || !node.parent.tag) return
      if (node.parent.tag.name !== mname) return

      const css = [ node.quasis.map(cooked) ]
        .concat(node.expressions.map(expr)).join('').trim()

      const val = {
        css: css,
        filename: filename,
        opts: xtend(opts),
        node: node.parent
      }

      nodes.push(val)
    }

    function extractImportNodes (node) {
      if (node.type !== 'CallExpression') return
      if (!node.callee || node.callee.type !== 'Identifier') return
      if (node.callee.name !== mname) return
      var pathOpts = { basedir: path.dirname(filename) }
      try {
        var resolvePath = cssResolve(node.arguments[0].value, pathOpts)
      } catch (err) {
        return self.emit('error', err)
      }

      self.emit('file', resolvePath)

      const iOpts = node.arguments[1]
        ? xtend(opts, staticEval(node.arguments[1]))
        : opts

      const val = {
        filename: resolvePath,
        opts: iOpts,
        node: node
      }

      nodes.push(val)
    }
  }

  // iterate over nodes, and apply sheetify transformation
  // then replace the AST nodes with new values
  // (obj, fn) -> null
  function iterate (val, done) {
    if (val.css) return handleCss(val)
    fs.readFile(val.filename, 'utf8', function (err, css) {
      if (err) return done(err)
      val.css = css
      handleCss(val)
    })

    function handleCss (val) {
      sheetify(val.css, val.filename, val.opts, function (err, css, prefix) {
        if (err) return done(err)
        const str = [
          "((require('sheetify/insert')(" + JSON.stringify(css) + ')',
          ' || true) && ' + JSON.stringify(prefix) + ')'
        ].join('')

        const parentNodeType = val.node.parent.type
        const lolSemicolon = parentNodeType === 'VariableDeclarator' ||
          parentNodeType === 'AssignmentExpression'
          ? ''
          : ';'
        val.node.update(lolSemicolon + str)
        done()
      })
    }
  }
}

function cooked (node) { return node.value.cooked }
function expr (ex) { return { _expr: ex.source() } }
