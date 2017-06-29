var str = require('string-to-stream')
var toBuffer = require('../')
var test = require('tape')

test('basic usage', function (t) {
  t.plan(2)
  var stream = str('0123456789')
  toBuffer(stream, 10, function (err, buf) {
    t.error(err)
    t.deepEqual(buf, new Buffer('0123456789'))
  })
})
