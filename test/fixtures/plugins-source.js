const sf = require('sheetify')

const prefix = sf`
  :host .hello, :host .world {
    transform: translate(0, 0);
  }
`
console.log(prefix)
