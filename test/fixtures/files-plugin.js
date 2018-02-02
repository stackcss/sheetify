module.exports = function (file, source, opts, done) {
  done(null, {
    css: '.test {}',
    files: [opts.file]
  })
}
