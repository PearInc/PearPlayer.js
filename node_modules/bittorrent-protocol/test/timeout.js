var Buffer = require('safe-buffer').Buffer
var Protocol = require('../')
var test = require('tape')

test('Timeout when peer does not respond', function (t) {
  t.plan(9)

  var timeouts = 0

  var wire = new Protocol()
  wire.on('error', function (err) { t.fail(err) })
  wire.pipe(wire)
  wire.setTimeout(1000)
  wire.handshake(Buffer.from('01234567890123456789'), Buffer.from('12345678901234567890'))

  wire.on('unchoke', function () {
    var requests = 0

    wire.request(0, 0, 0, function (err) {
      t.ok(err)
      t.ok(++requests === 1)
    })

    wire.request(0, 0, 0, function (err) {
      t.ok(err)
      t.ok(++requests === 2)
    })

    wire.request(0, 0, 0, function (err) {
      t.ok(err)
      t.ok(++requests === 3)
    })
  })

  wire.on('timeout', function () {
    t.ok(++timeouts <= 3) // should get called 3 times
  })

  wire.unchoke()
})
