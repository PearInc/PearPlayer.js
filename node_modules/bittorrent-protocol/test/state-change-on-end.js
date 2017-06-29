var Buffer = require('safe-buffer').Buffer
var Protocol = require('../')
var test = require('tape')

test('State changes correctly on wire \'end\'', function (t) {
  t.plan(11)

  var wire = new Protocol()
  wire.on('error', function (err) { t.fail(err) })
  wire.pipe(wire)

  wire.handshake(Buffer.from('01234567890123456789'), Buffer.from('12345678901234567890'))

  t.ok(wire.amChoking)
  t.ok(wire.peerChoking)

  wire.on('unchoke', function () {
    t.ok(!wire.amChoking)
    t.ok(!wire.peerChoking)
    wire.interested()
  })

  wire.on('interested', function () {
    t.ok(wire.peerInterested)
    destroy()
  })

  function destroy () {
    wire.on('choke', function () {
      t.pass('wire got choke event')
    })
    wire.on('uninterested', function () {
      t.pass('wire got uninterested event')
    })

    wire.on('end', function () {
      t.ok(wire.peerChoking)
      t.ok(!wire.peerInterested)
    })

    wire.on('finish', function () {
      t.ok(wire.peerChoking)
      t.ok(!wire.peerInterested)
    })

    wire.destroy()
  }

  wire.unchoke()
})
