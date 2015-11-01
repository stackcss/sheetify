const sheetify = require('sheetify')
const divStyle = sheetify('./index.css')

module.exports = render

function render (h, state) {
  return h('div', { className: divStyle }, [
    h('h1', { className: 'title' }, 'Hello World'),
    h('h2', 'Lorem Ipsum')
  ])
}
