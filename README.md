# sheetify
[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![Downloads][downloads-image]][downloads-url]
[![js-standard-style][standard-image]][standard-url]

Modular CSS bundler for browserify. Works with [npm](http://npmjs.org/) modules
like [browserify](http://browserify.org/) does.

## Features
- __clarity:__ namespace CSS, no more need for naming schemes
- __modularity:__ import and reuse CSS packages from npm
- __extensibility:__ transform CSS using existing transforms, or write your own
- __transparency:__ inline CSS in your views
- __simplicity:__ tiny API surface and a minimal code base

## Example
Given some inline CSS:
```js
const css = require('sheetify')
const html = require('bel')

const prefix = css`
  :host > h1 {
    text-align: center;
  }
`

const tree = html`
  <section class=${prefix}>
    <h1>My beautiful, centered title</h1>
  </section>
`

document.body.appendChild(tree)
```

Compile with browserify using `-t sheetify`:
```sh
$ browserify -t sheetify index.js > bundle.js
```

CSS classes are namespaced based on the content hash:
```css
._60ed23ec9f > h1 {
  text-align: center;
}
```

And the rendered HTML includes the namespace:
```html
<section class="_60ed23ec9f">
  <h1>My beautiful, centered title</h1>
</section>
```

## Styling host elements
The element that gets a prefix applied can be styled using the [`:host`
pseudoselector][1]:
```js
const css = require('sheetify')
const html = require('bel')

const prefix = css`
  :host {
    background-color: blue;
  }

  :host > h1 {
    text-decoration: underline;
  }
`

const tree = html`
  <section class=${prefix}>
    <h1>My beautiful, centered title</h1>
  </section>
`

document.body.appendChild(tree)
```

By using `:host` we are able to provide styles for the parent element:

```css
._60ed23ec9f {
  background-color: blue;
}

._60ed23ec9f > h1 {
  text-decoration: underline;
}
```

```html
<section class="_60ed23ec9f">
  <h1>My beautiful, centered title</h1>
</style>
```

## Dynamic vs static
Sheetify is very good for namespacing static css assets in your javaScript code. Currently there is no support for dynamic variables within sheetify, however you could achieve this by setting the inline style property of an element.

```js
const css = require('sheetify')
const html = require('bel')

const sectionWidth = '100px';
const prefix = css`
  :host {
    background-color: blue;
  }

  :host > h1 {
    text-decoration: underline;
  }
`

const tree = html`
  <section class=${prefix} style="width:${sectionWidth}">
    <h1>My beautiful, centered title</h1>
  </section>
`

document.body.appendChild(tree)
```

Should you want to, you could even set dynamic variables in an object and do a rather complicated JSON.stringify with a replace on that object to turn it into a style for an element.

```js

const dynamicStyles = {
  width: global.window.innerWidth,
  height: global.window.innerHeight,
}

let dynamicStyleString = JSON.stringify(dynamicStyles)
    .replace(/\,/g,';')
    .replace(/\"/g,'')
    .replace(/\{|\}/g,'')

const tree = html`
  <div style="${dynamicStyleString}">
    <h1>My beautiful, window width</h1>
  </div>
`
```


## External files
To include an external CSS file you can pass a path to sheetify as
`sheetify('./my-file.css')`:
```js
const css = require('sheetify')
const html = require('bel')

const prefix = css('./my-styles.css')

const tree = html`
  <section class=${prefix}>
    <h1>My beautiful, centered title</h1>
  </section>
`

document.body.appendChild(tree)
```

## Use npm packages
To consume a package from npm that has `.css` file in its `main` or `style`
field:
```js
const css = require('sheetify')

css('normalize.css')
```
Packages from npm will not be namespaced by default.

## Write to separate file on disk
To write the compiled CSS to a separate file, rather than keep it in the
bundle use [css-extract][2]:
```sh
$ browserify index.js \
  -t [ sheetify ] \
  -p [ css-extract -o bundle.css ] index.js \
  -o bundle.js
```
[css-extract][2] can also write to a stream from the JS api, look at the
documentation to see how.

## Transforms
Sheetify uses [transforms](#transforms) that take CSS and apply a transform.
For example include
[sheetify-cssnext](https://github.com/sheetify/sheetify-cssnext) to support
autoprefixing, variables and more:
```js
const css = require('sheetify')
const html = require('bel')

const prefix = css`
  h1 {
    transform: translate(0, 0);
  }
`

const tree = html`
  <section class=${prefix}>
    <h1>My beautiful, centered title</h1>
  </section>
`

document.body.appendChild(tree)
```

Compile with browserify using `-t [ sheetify -t sheetify-cssnext ]`:
```sh
$ browserify -t [ sheetify -t sheetify-cssnext ] index.js > bundle.js
```

Transforms the CSS into:
```css
h1 {
  -webkit-transform: translate(0, 0);
          transform: translate(0, 0);
}
```

## API
Browserify transforms accept either flags from the command line using
[subargs](https://github.com/substack/subarg):
```sh
$ browserify -t [ sheetify -t sheetify-cssnext ] index.js > bundle.js
```

Or the equivalent options by passing in a configuration object in the
JavaScript API:
```js
const browserify = require('browserify')

const b = browserify(path.join(__dirname, 'transform/source.js'))
b.transform('sheetify', { transform: [ 'sheetify-cssnext' ] })
b.bundle().pipe(process.stdout)
```

The following options are available:
```txt
Options:
  -t, --transform    Consume a sheetify transform
```

## Installation
```sh
$ npm install sheetify
```

## See Also
- [browserify](https://github.com/substack/node-browserify) - browser-side
  require() the node.js way
- [glslify](https://github.com/stackgl/glslify) - module system for GLSL
  shaders
- [hyperx](https://github.com/substack/hyperx) - transform inline HTML to JS
- [bankai](https://github.com/yoshuawuyts/bankai) - DIY server middleware for
  JS, CSS and HTML
- [css-extract][2]: extract CSS from a browserify bundle

## License
[MIT](https://tldrlegal.com/license/mit-license)

[npm-image]: https://img.shields.io/npm/v/sheetify.svg?style=flat-square
[npm-url]: https://npmjs.org/package/sheetify
[travis-image]: https://img.shields.io/travis/stackcss/sheetify/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/stackcss/sheetify
[codecov-image]: https://img.shields.io/codecov/c/github/stackcss/sheetify/master.svg?style=flat-square
[codecov-url]: https://codecov.io/github/stackcss/sheetify
[downloads-image]: http://img.shields.io/npm/dm/sheetify.svg?style=flat-square
[downloads-url]: https://npmjs.org/package/sheetify
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[standard-url]: https://github.com/feross/standard
[1]: http://www.html5rocks.com/en/tutorials/webcomponents/shadowdom-201/#toc-style-host
[2]: https://github.com/stackcss/css-extract
