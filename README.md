# sheetify
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
bundler.bundle((err, res) => {
  if (err) return console.error(err)
  console.log(res)
})
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

# License
MIT
