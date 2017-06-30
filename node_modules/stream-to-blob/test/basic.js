var test = require('tape')
var toBlob = require('../')
var toBuffer = require('blob-to-buffer')
var toStream = require('string-to-stream')

test('basic usage', function (t) {
  t.plan(3)
  var str = '0123456789'
  var stream = toStream(str)
  toBlob(stream, 'text/plain', function (err, blob) {
    t.error(err)
    toBuffer(blob, function (err, buf) {
      t.error(err)
      t.equal(buf.toString(), str)
    })
  })
})

test('basic usage (without mimeType)', function (t) {
  t.plan(3)
  var str = '0123456789'
  var stream = toStream(str)
  toBlob(stream, function (err, blob) {
    t.error(err)
    toBuffer(blob, function (err, buf) {
      t.error(err)
      t.equal(buf.toString(), str)
    })
  })
})

test('stress test usage', function (t) {
  t.plan(3)
  var str = new Array(1000000).join('0123456789')
  var stream = toStream(str)
  toBlob(stream, 'text/plain', function (err, blob) {
    t.error(err)
    toBuffer(blob, function (err, buf) {
      t.error(err)
      t.equal(buf.toString(), str)
    })
  })
})
