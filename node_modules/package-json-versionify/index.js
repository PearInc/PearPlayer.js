'use strict'
const browserifyPackageJSON = require('browserify-package-json')

module.exports = function (filename, options) {
  return browserifyPackageJSON(filename, Object.assign(options || {}, { only: 'version' }))
}
