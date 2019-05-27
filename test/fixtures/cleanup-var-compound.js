const css = require('sheetify')

const html = function() {}

const red = css`
  :host {
    color: red;
  }
`

const a = html`<p>beep</p>`

const green = css`
  :host {
    color: green;
  }
`
const b = html`<p>boop</p>`

const blue = css`
  :host {
    color: blue;
  }
`

console.log(blue)
