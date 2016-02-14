const resolve = require('resolve')
const path = require('path')

module.exports = cssResolve

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
