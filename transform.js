const isMemberExpression = require('estree-is-member-expression')
const cssResolve = require('style-resolve').sync
const transformAst = require('transform-ast')
const staticEval = require('static-eval')
const parse = require('fast-json-parse')
const findup = require('@choojs/findup')
const mapLimit = require('map-limit')
const through = require('through2')
const xtend = require('xtend')
const path = require('path')
const fs = require('fs')

const sheetify = require('./index')

module.exports = transform

function isBabelTemplateDefinition (node) {
  return node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' && node.callee.name === '_taggedTemplateLiteral'
}

function isBubleTemplateDefinition (node) {
  return node.type === 'CallExpression' &&
    isMemberExpression(node.callee, 'Object.freeze') &&
    node.arguments[0] && node.arguments[0].type === 'ArrayExpression' &&
    node.arguments[0].elements.every(function (el) { return el.type === 'Literal' })
}

// inline sheetify transform for browserify
// obj -> (str, opts) -> str
function transform (filename, options) {
  if (/\.json$/i.test(filename)) return through()

  const opts = xtend(options || {
    basedir: process.cwd(),
    transform: [],
    out: ''
  })

  opts.transform = [].concat(opts.transform || []).concat(opts.t || []).map(function (plugin) {
    // resolve subarg syntax
    if (typeof plugin === 'object' && Array.isArray(plugin._)) {
      return [
        plugin._[0],
        plugin
      ]
    }
    return plugin
  })

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
    const babelTemplateObjects = {}
    const bubleTemplateObjects = {}
    const src = Buffer.concat(bufs).toString('utf8')
    var mname = null
    var ast

    if (src.indexOf('sheetify') === -1) {
      self.push(src)
      self.push(null)
      return
    }

    findTransforms(filename, function (err, transforms) {
      if (err) return self.emit('error', err)

      opts.transform = transforms.concat(opts.transform || []).concat(opts.t || [])

      try {
        ast = transformAst(src, {
          parser: require('acorn-node'),
          inputFilename: path.basename(filename)
        }, identifyModuleName)
        ast.walk(extractNodes)
      } catch (err) {
        return self.emit('error', err)
      }

      // transform all detected nodes and
      // close stream when done
      mapLimit(nodes, Infinity, iterate, function (err) {
        if (err) return self.emit('error', err)
        self.push(ast.toString({
          map: opts && opts._flags && opts._flags.debug
        }))
        self.push(null)
      })
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
      var css
      var elements

      if (node.type === 'VariableDeclarator' && node.init) {
        if (isBabelTemplateDefinition(node.init)) {
          // Babel generates helper calls like
          //    _taggedTemplateLiteral([":host .class { color: hotpink; }"], [":host .class { color: hotpink; }"])
          // we only keep the "cooked" part
          babelTemplateObjects[node.id.name] = node.init.arguments[0]
        } else if (isBubleTemplateDefinition(node.init)) {
          // Buble generates helper calls like
          //    Object.freeze([":host .class { color: hotpink; }"])
          bubleTemplateObjects[node.id.name] = node.init.arguments[0]
        }
      }

      if (node.type === 'TemplateLiteral' && node.parent && node.parent.tag) {
        if (node.parent.tag.name !== mname) return

        css = [ node.quasis.map(cooked) ]
          .concat(node.expressions.map(expr)).join('').trim()

        nodes.push({
          css: css,
          filename: filename,
          opts: xtend(opts),
          node: node.parent
        })
      }

      if (node.type === 'CallExpression' && node.callee.type === 'Identifier' && node.callee.name === mname) {
        if (node.arguments[0] && node.arguments[0].type === 'ArrayExpression') {
          // Buble generates code like
          //     sheetify([":host .class { color: hotpink; }"])
          elements = node.arguments[0].elements
        } else if (node.arguments[0] && node.arguments[0].type === 'Identifier') {
          // Babel generates code like
          //    sheetify(_templateObject)
          var arg = node.arguments[0].name
          if (babelTemplateObjects[arg]) {
            elements = babelTemplateObjects[arg].elements
          } else if (bubleTemplateObjects[arg]) {
            elements = bubleTemplateObjects[arg].elements
          }
        }

        if (elements) {
          nodes.push({
            css: elements.map(function (part) { return part.value }).join(''),
            filename: filename,
            opts: xtend(opts),
            node: node
          })
        }
      }
    }

    function extractImportNodes (node) {
      if (node.type !== 'CallExpression') return
      if (!node.callee || node.callee.type !== 'Identifier') return
      if (node.callee.name !== mname) return
      if (!node.arguments[0] || !node.arguments[0].value) return
      var pathOpts = { basedir: path.dirname(filename) }
      try {
        var resolvePath = cssResolve(node.arguments[0].value, pathOpts)
      } catch (err) {
        return self.emit('error', err)
      }

      const iOpts = node.arguments[1]
        ? xtend(opts, staticEval(node.arguments[1]))
        : opts

      transformStream.emit('file', resolvePath)

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
    if (typeof val.css === 'string') return handleCss(val)

    if (/\.js$/.test(val.filename)) {
      delete require.cache[require.resolve(val.filename)]
      val.css = require(val.filename)
      handleCss(val)
    } else {
      fs.readFile(val.filename, 'utf8', function (err, css) {
        if (err) return done(err)
        val.css = css
        handleCss(val)
      })
    }

    function handleCss (val) {
      sheetify(val.css, val.filename, val.opts, function (err, result, prefix) {
        if (err) return done(err)
        const str = [
          "((require('sheetify/insert')(" + JSON.stringify(result.css) + ')',
          ' || true) && ' + JSON.stringify(prefix) + ')'
        ].join('')

        const parentNodeType = val.node.parent.type
        const lolSemicolon = parentNodeType === 'VariableDeclarator' ||
          parentNodeType === 'AssignmentExpression'
          ? ''
          : ';'
        val.node.update(lolSemicolon + str)

        result.files.forEach(function (includedFile) {
          transformStream.emit('file', includedFile)
        })

        done()
      })
    }
  }

  function findTransforms (filename, done) {
    findup(filename, 'package.json', function (err, pathname) {
      // no package.json found - just run local transforms
      if (err) return done(null, [])

      var filename = path.join(pathname, 'package.json')
      fs.readFile(filename, function (err, file) {
        if (err) return done(err)
        var parsed = parse(file)
        if (parsed.err) return done(parsed.err)
        var json = parsed.value
        var d = json.sheetify
        if (!d) return done(null, [])
        var t = d.transform
        if (!t || !Array.isArray(t)) return done(null, [])

        return done(null, t)
      })
    })
  }
}

function cooked (node) { return node.value.cooked }
function expr (ex) { return { _expr: ex.source() } }
