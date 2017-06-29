var Buffer = require('safe-buffer').Buffer
var Protocol = require('../')
var test = require('tape')

test('No timeout when peer is good', function (t) {
  t.plan(3)

  var wire = new Protocol()
  wire.on('error', function (err) { t.fail(err) })
  wire.pipe(wire)
  wire.setTimeout(1000)
  wire.handshake(Buffer.from('01234567890123456789'), Buffer.from('12345678901234567890'))

  wire.on('unchoke', function () {
    wire.request(0, 0, 11, function (err) {
      t.error(err)
    })

    wire.request(0, 0, 11, function (err) {
      t.error(err)
    })

    wire.request(0, 0, 11, function (err) {
      t.error(err)
    })
  })

  wire.on('request', function (i, offset, length, callback) {
    callback(null, Buffer.from('hello world'))
  })

  // there should never be a timeout
  wire.on('timeout', function () {
    t.fail('Timed out')
  })

  wire.unchoke()
})
