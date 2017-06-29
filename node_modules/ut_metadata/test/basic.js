var bencode = require('bencode')
var fixtures = require('webtorrent-fixtures')
var Protocol = require('bittorrent-protocol')
var test = require('tape')
var utMetadata = require('../')

test('wire.use(utMetadata())', function (t) {
  var wire = new Protocol()
  wire.pipe(wire)

  wire.use(utMetadata())

  t.ok(wire.ut_metadata)
  t.ok(wire.ut_metadata.fetch)
  t.ok(wire.ut_metadata.cancel)
  t.notOk(wire.ut_metadata.metadata)
  t.end()
})

test('wire.use(utMetadata(metadata))', function (t) {
  var wire = new Protocol()
  wire.pipe(wire)

  wire.use(utMetadata(fixtures.leavesMetadata.torrent))

  t.ok(wire.ut_metadata)
  t.ok(wire.ut_metadata.fetch)
  t.ok(wire.ut_metadata.cancel)
  t.equal(wire.ut_metadata.metadata.toString('hex'), bencode.encode(bencode.decode(fixtures.leavesMetadata.torrent).info).toString('hex'))
  t.end()
})
