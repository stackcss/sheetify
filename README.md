# sheetify #
[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][downloads-url]

A module bundler for CSS that works with [npm](http://npmjs.org/) modules
like [browserify](http://browserify.org/) does.

Use CSS style `@import` to organize your CSS and load
modules. Sheetify will recursively analyze all `@import` calls in your CSS to
build a bundle you can serve in a single `<link>` tag.

## Usage
#### As a standalone CLI tool
``` bash
Usage:

  sheetify [entry file] {OPTIONS}

Options:

  --transform, -t  Include a sheetify transform.
   --modifier, -m  Include a sheetify modifier.
   --compress, -c  Compress final output.
    --version, -v  Output version information and quit.
      --debug, -d  Inline CSS sourcemaps to final output.
```

#### As a node module
```js
var variables = require('sheetify-variables');
var media = require('sheetify-custom-media');
var calc = require('sheetify-calc');
var sheetify = require('sheetify');

sheetify('path/to/my/index.css')
  .transform(variables())
  .transform(media())
  .transform(calc())
  .bundle();
```

## License
[MIT](https://tldrlegal.com/license/mit-license)

[npm-image]: https://img.shields.io/npm/v/sheetify.svg?style=flat-square
[npm-url]: https://npmjs.org/package/sheetify
[downloads-image]: http://img.shields.io/npm/dm/sheetify.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/sheetify
