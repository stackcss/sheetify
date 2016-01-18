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

## Features
- rich plugin ecosystem
- namespaced CSS modules using browserify
- tiny API surface

## Installation
```sh
$ npm install sheetify
```

## Usage
__js api__
```js
const browserify = require('browserify')
const path = require('path')

browserify(path.join(__dirname, './index.js'))
  .transform('sheetify/transform')
  .bundle()
  .pipe(process.stdout)
```

__package.json transform__
```json
{
  "name": "my-app",
  "browserify":{
    "transform": [
      "sheetify/transform"
    ]
  }
}
```

__cli__
```sh
$ browserity -t sheetify/transform index.js > bundle.js
```

## Plugins
- [sheetify-cssnext](https://github.com/sheetify/sheetify-cssnext) cssnext
  plugin for sheetify

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
