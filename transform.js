const staticEval = require('static-eval')
const escodegen = require('escodegen')
const mapLimit = require('map-limit')
const astw = require('astw-babylon')
const through = require('through2')
const babylon = require('babylon')
const sleuth = require('sleuth')
const sheetify = require('./')
const path = require('path')

module.exports = transform

function transform (filename, options) {
  const buffer = []

  return through(write, flush)

  function write (chunk, _, next) {
    buffer.push(chunk)
    next()
  }

  function flush () {
    const stream = this
    const src = buffer.join('')
    const ast = babylon.parse(src, {
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      allowHashBang: true,
      ecmaVersion: 6,
      strictMode: false,
      sourceType: 'module',
      features: {},
      plugins: {
        jsx: true,
        flow: true
      }
    })

    const requires = sleuth(ast.program)
    const walk = astw(ast)
    const context = {
      __dirname: path.dirname(filename),
      __filename: filename
    }

    const sheetifyNames = Object.keys(requires).filter(function (key) {
      return requires[key] === 'sheetify'
    })

    if (!sheetifyNames.length) {
      stream.push(src)
      stream.push(null)
      return
    }

    filterRequires(ast.program, function (target) {
      return target !== 'sheetify'
    })

    mapLimit(sheetifyNames, 1, function (varname, next) {
      walk(function (node) {
        if (node.name !== varname) return
        if (node.type !== 'Identifier') return
        if (node.parent.type !== 'CallExpression') return

        const args = node.parent.arguments.map(function (node) {
          return staticEval(node, context)
        })

        const sourceFile = args[0]
        const opts = typeof args[1] === 'object'
          ? args[1]
          : {}

        opts.basedir = opts.basedir || path.dirname(filename)

        sheetify(sourceFile, opts, function (err, style, uuid) {
          if (err) return next(err)

          const parent = node.parent

          parent.type = 'Literal'
          parent.value = uuid
          parent.raw = JSON.stringify(parent.value)
          delete parent.arguments
          delete parent.name

          next(null, style)
        })
      })
    }, function (err, styles) {
      if (err) return stream.emit('error', err)

      const relative = getRequirePath(filename)
      const req = path.join(relative, 'insert-css')

      styles = styles.join('\n')

      ast.program.body.unshift({
        type: 'ExpressionStatement',
        expression: {
          type: 'CallExpression',
          callee: {
            type: 'CallExpression',
            callee: {
              type: 'Identifier',
              name: 'require'
            },
            arguments: [
              {
                type: 'Literal',
                value: req,
                rawValue: req,
                raw: JSON.stringify(req)
              }
            ]
          },
          arguments: [
            {
              type: 'Literal',
              value: styles,
              rawValue: styles,
              raw: JSON.stringify(styles)
            }
          ]
        }
      })

      stream.push(escodegen.generate(ast.program))
      stream.push(null)
    })
  }
}

function getRequirePath (filename) {
  return path.relative(path.dirname(filename), path.dirname(__filename))
}

// doesn't currently handle inline requires, i.e.
// require('sheetify')('./index.css')
function filterRequires (program, filter) {
  program.body = program.body.filter(function (node) {
    if (node.type !== 'VariableDeclaration') return true

    const decl = node.declarations

    for (var i = 0; i < decl.length; i++) {
      if (decl[i].init.type !== 'CallExpression') continue
      if (decl[i].init.callee.name !== 'require') continue
      var args = decl[i].init.arguments
      if (filter(args[0].value)) continue
      decl.splice(i--, 1)
    }

    return decl.length
  })

  return program.body
}
