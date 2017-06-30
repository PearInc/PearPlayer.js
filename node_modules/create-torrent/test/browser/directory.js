/* global Blob */

var createTorrent = require('../../')
var fs = require('fs')
var parseTorrent = require('parse-torrent')
var path = require('path')
var sha1 = require('simple-sha1')
var test = require('tape')

function makeFileShim (buf, name, fullPath) {
  var file = new Blob([ buf ])
  file.fullPath = fullPath
  file.name = name
  return file
}

var numbers1 = makeFileShim(fs.readFileSync(path.join(__dirname, '../../node_modules/webtorrent-fixtures/fixtures/numbers/1.txt'), 'utf8'), '1.txt', 'numbers/1.txt')
var numbers2 = makeFileShim(fs.readFileSync(path.join(__dirname, '../../node_modules/webtorrent-fixtures/fixtures/numbers/2.txt'), 'utf8'), '2.txt', 'numbers/2.txt')
var numbers3 = makeFileShim(fs.readFileSync(path.join(__dirname, '../../node_modules/webtorrent-fixtures/fixtures/numbers/3.txt'), 'utf8'), '3.txt', 'numbers/3.txt')

var DSStore = makeFileShim('blah', '.DS_Store', '/numbers/.DS_Store') // this should be ignored

test('create multi file torrent with directory at root', function (t) {
  t.plan(15)

  var startTime = Date.now()
  createTorrent([ numbers1, numbers2, numbers3, DSStore ], function (err, torrent) {
    t.error(err)

    var parsedTorrent = parseTorrent(torrent)

    t.equals(parsedTorrent.name, 'numbers')

    t.notOk(parsedTorrent.private)

    t.ok(parsedTorrent.created.getTime() >= startTime, 'created time is after start time')

    t.ok(Array.isArray(parsedTorrent.announce))

    t.deepEquals(parsedTorrent.files[0].path, 'numbers/1.txt')
    t.deepEquals(parsedTorrent.files[0].length, 1)

    t.deepEquals(parsedTorrent.files[1].path, 'numbers/2.txt')
    t.deepEquals(parsedTorrent.files[1].length, 2)

    t.deepEquals(parsedTorrent.files[2].path, 'numbers/3.txt')
    t.deepEquals(parsedTorrent.files[2].length, 3)

    t.equal(parsedTorrent.length, 6)
    t.equal(parsedTorrent.info.pieces.length, 20)

    t.deepEquals(parsedTorrent.pieces, [
      '1f74648e50a6a6708ec54ab327a163d5536b7ced'
    ])

    t.equals(sha1.sync(parsedTorrent.infoBuffer), '89d97c2261a21b040cf11caa661a3ba7233bb7e6')
  })
})
