module.exports = function(file) {
  return function(style, next) {
    return next(null, style)
  }
}
