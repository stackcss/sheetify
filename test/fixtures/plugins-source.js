var sf = require('sheetify')

var prefix = sf`
  :host .hello, :host .world {
    transform: translate(0, 0);
  }
`
console.log(prefix)
