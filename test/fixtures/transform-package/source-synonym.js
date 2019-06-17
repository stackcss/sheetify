const sf = require('hui/css')

const prefix = sf`
  :host .hello, :host .world {
    transform: translate(0, 0);
  }
`

var foo = {}
foo.bar = sf`
  :host .hello, :host .world {
    transform: translate(0, 0);
  }
`

console.log(prefix)
