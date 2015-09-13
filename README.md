# sheetify
<img
  alt="sheetify logo"
  height="100"
  style="max-width: 100%"
  data-canonical-src="https://github.com/sheetify/logo"
  src="https://raw.githubusercontent.com/sheetify/logo/master/512v6.png">

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![Downloads][downloads-image]][downloads-url]
[![js-standard-style][standard-image]][standard-url]

Modular CSS bundler. Works with [npm](http://npmjs.org/) modules like
[browserify](http://browserify.org/) does.

__Features__
- source map support
- minification
- rich plugin ecosystem
- streaming interface
- easily extensible

## Usage
__cli__
```txt
sheetify - Modular CSS bundler

Usage: sheetify [options] [entry file]

Options:
  -h, --help        Output usage information
  -v, --version     Output version number
  -t, --transform   Include a sheetify transform
  -m, --modifier    Include a sheetify modifier
  -c, --compress    Compress final output
  -d, --debug       Inline CSS sourcemaps

Examples:
  $ sheetify index.css > bundle.css   # Bundle index.css to bundle.css
  $ sheetify -cd index.css            # Compress and include source maps

Docs: https://github.com/sheetify/sheetify
Bugs: https://github.com/sheetify/sheetify/issues
```

__api__
```js
const sheetify = require('sheetify')

const bundler = sheetify('./index.css')
bundler.bundle().pipe(process.stdout)
```

## Options
### transform
[tbi]

### modifier
[tbi]

### compress
[tbi]

### debug
[tbi]

## API
### bundler = sheetify(entry)
[tbi]

### bundler.bundle(cb(err, res))
[tbi]

## License
[MIT](https://tldrlegal.com/license/mit-license)

[npm-image]: https://img.shields.io/npm/v/sheetify.svg?style=flat-square
[npm-url]: https://npmjs.org/package/sheetify
[travis-image]: https://img.shields.io/travis/sheetify/sheetify/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/sheetify/sheetify
[codecov-image]: https://img.shields.io/codecov/c/github/sheetify/sheetify/master.svg?style=flat-square
[codecov-url]: https://codecov.io/github/sheetify/sheetify
[downloads-image]: http://img.shields.io/npm/dm/sheetify.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/sheetify
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: https://github.com/feross/standard
