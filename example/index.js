const sheetify = require('sheetify')
const domify = require('domify')
const prefix = sheetify('./index.css')

document.body.appendChild(domify(`
  <div class="${prefix}">
    <h1>Styled</h1>
  </div>
  <div>
    <h1>Unstyled</h1>
  </div>
`))
