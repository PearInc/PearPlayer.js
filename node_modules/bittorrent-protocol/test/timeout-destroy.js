var Buffer = require('safe-buffer').Buffer
var Protocol = require('../')
var test = require('tape')

test('Timeout and destroy when peer does not respond', function (t) {
  t.plan(4)

  var timeouts = 0

  var wire = new Protocol()
  wire.on('error', function (err) { t.fail(err) })
  wire.pipe(wire)
  wire.setTimeout(1000)
  wire.handshake(Buffer.from('01234567890123456789'), Buffer.from('12345678901234567890'))

  wire.on('unchoke', function () {
    wire.request(0, 0, 0, function (err) {
      t.ok(err)
    })

    wire.request(0, 0, 0, function (err) {
      t.ok(err)
    })

    wire.request(0, 0, 0, function (err) {
      t.ok(err)
    })
  })

  wire.on('timeout', function () {
    t.equal(++timeouts, 1)
    wire.end()
  })

  wire.unchoke()
})
