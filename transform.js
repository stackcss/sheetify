var cssResolve = require('style-resolve').sync
var staticEval = require('static-eval')
var mapLimit = require('map-limit')
var through = require('through2')
var falafel = require('falafel')
var xtend = require('xtend')
var path = require('path')
var fs = require('fs')

var sheetify = require('./index')

module.exports = transform

// inline sheetify transform for browserify
// obj -> (str, opts) -> str
function transform (filename, options) {
  if (/\.json$/i.test(filename)) return through()

  var opts = xtend(options || {
    basedir: process.cwd(),
    use: [],
    out: ''
  })

  opts.use = [].concat(opts.use || []).concat(opts.u || [])

  var bufs = []
  var transformStream = through(write, end)
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
    var self = this

    // cool, you've made it this far. We know this is gross,
    // but tough times call for tough measure. Please don't
    // judge us too harshly, we'll work on perf ✨soon✨ -yw
    var nodes = []
    var src = Buffer.concat(bufs).toString('utf8')
    var mname = null
    var ast

    if (src.indexOf('sheetify') === -1) {
      self.push(src)
      self.push(null)
      return
    }

    try {
      var tmpAst = falafel(src, { ecmaVersion: 6 }, identifyModuleName)
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

      var css = [ node.quasis.map(cooked) ]
        .concat(node.expressions.map(expr)).join('').trim()

      var val = {
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
      try {
        var resolvePath = cssResolve(node.arguments[0].value, {
          basedir: path.dirname(filename)
        })
        self.emit('file', resolvePath)
      } catch (err) {
        return self.emit('error', err)
      }

      var iOpts = (node.arguments[1])
        ? xtend(opts, staticEval(node.arguments[1]))
        : opts

      var val = {
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
        var str = [
          "((require('sheetify/insert')(" + JSON.stringify(css) + ')',
          ' || true) && ' + JSON.stringify(prefix) + ')'
        ].join('')

        var lolSemicolon = (val.node.parent.type === 'VariableDeclarator')
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
