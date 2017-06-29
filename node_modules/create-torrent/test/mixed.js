var createTorrent = require('../')
var fixtures = require('webtorrent-fixtures')
var fs = require('fs')
var parseTorrent = require('parse-torrent')
var path = require('path')
var sha1 = require('simple-sha1')
var test = require('tape')

test('create multi file torrent with array of mixed types', function (t) {
  t.plan(20)

  var number11Path = path.join(fixtures.lotsOfNumbers.contentPath, 'big numbers', '11.txt')
  var number10Path = path.join(fixtures.lotsOfNumbers.contentPath, 'big numbers', '10.txt')
  var numbersPath = fixtures.numbers.contentPath

  var stream = fs.createReadStream(number10Path)
  stream.name = '10.txt'

  // Note: Order should be preserved
  var input = [ number11Path, stream, numbersPath ]

  var startTime = Date.now()
  createTorrent(input, {
    name: 'multi',
    pieceLength: 32768, // force piece length to 32KB so info-hash will
                        // match what transmission generated, since we use
                        // a different algo for picking piece length

    private: false      // also force `private: false` to match transmission

  }, function (err, torrent) {
    t.error(err)

    var parsedTorrent = parseTorrent(torrent)

    t.equals(parsedTorrent.name, 'multi')

    t.notOk(parsedTorrent.private)

    t.ok(parsedTorrent.created.getTime() >= startTime, 'created time is after start time')

    t.ok(Array.isArray(parsedTorrent.announce))

    t.deepEquals(path.normalize(parsedTorrent.files[0].path), path.normalize('multi/11.txt'))
    t.deepEquals(parsedTorrent.files[0].length, 2)

    t.deepEquals(path.normalize(parsedTorrent.files[1].path), path.normalize('multi/10.txt'))
    t.deepEquals(parsedTorrent.files[1].length, 2)

    t.deepEquals(path.normalize(parsedTorrent.files[2].path), path.normalize('multi/numbers/1.txt'))
    t.deepEquals(parsedTorrent.files[2].length, 1)

    t.deepEquals(path.normalize(parsedTorrent.files[3].path), path.normalize('multi/numbers/2.txt'))
    t.deepEquals(parsedTorrent.files[3].length, 2)

    t.deepEquals(path.normalize(parsedTorrent.files[4].path), path.normalize('multi/numbers/3.txt'))
    t.deepEquals(parsedTorrent.files[4].length, 3)

    t.equal(parsedTorrent.length, 10)
    t.equal(parsedTorrent.info.pieces.length, 20)
    t.equal(parsedTorrent.pieceLength, 32768)

    t.deepEquals(parsedTorrent.pieces, [
      '9ad893bb9aeca601a0fab4ba85bd4a4c18b630e3'
    ])
    t.equals(sha1.sync(parsedTorrent.infoBuffer), 'bad3f8ea0d1d8a55c18a039dd464f1078f83dba2')
  })
})
