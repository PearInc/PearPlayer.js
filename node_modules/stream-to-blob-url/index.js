/* global URL */

var getBlob = require('stream-to-blob')

module.exports = function getBlobURL (stream, mimeType, cb) {
  if (typeof mimeType === 'function') return getBlobURL(stream, null, mimeType)
  getBlob(stream, mimeType, function (err, blob) {
    if (err) return cb(err)
    var url = URL.createObjectURL(blob)
    cb(null, url)
  })
}
