const sf = require('sheetify')

const prefix = sf`
  hello, world {
    transform: translate(0, 0);
  }
`
console.log(prefix)
