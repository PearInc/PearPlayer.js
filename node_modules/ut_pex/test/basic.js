/* jshint camelcase: false */

var Protocol = require('bittorrent-protocol')
var utPex = require('../')
var test = require('tape')

test('wire.use(ut_pex())', function (t) {
  var wire = new Protocol()
  wire.pipe(wire)

  wire.use(utPex())

  t.ok(wire.ut_pex)
  t.ok(wire.ut_pex.start)
  t.ok(wire.ut_pex.stop)
  t.ok(wire.ut_pex.reset)
  t.ok(wire.ut_pex.addPeer)
  t.ok(wire.ut_pex.dropPeer)
  t.ok(wire.ut_pex.on)
  t.notOk(wire.ut_pex.peers)
  t.end()
})

// TODO: more thorough unit tests
