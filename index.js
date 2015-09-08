const styledeps = require('style-deps')
const assert = require('assert')
const xtend = require('xtend')

module.exports = Sheetify

function Sheetify (entry) {
  if (!(this instanceof Sheetify)) return new Sheetify(entry)
  assert.equal(typeof entry, 'string')

  this.transforms = []
  this.entry = entry

  return this
}

Sheetify.prototype.transform = function (transform) {
  this.transforms.push(transform)
  return this
}

Sheetify.prototype.bundle = function (opts, done) {
  if (!done) {
    done = opts
    opts = {}
  }
  assert.equal(typeof opts, 'object')
  assert.equal(typeof done, 'function')

  const base = {
    transforms: this.transforms,
    modifiers: this.modifiers
  }

  return styledeps(this.entry, xtend(opts, base), done)
}
