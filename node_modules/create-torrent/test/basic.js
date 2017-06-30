var createTorrent = require('../')
var parseTorrent = require('parse-torrent')
var test = require('tape')
var path = require('path')

test('implicit torrent name and file name', function (t) {
  t.plan(5)

  var buf1 = Buffer.from('buf1')

  createTorrent(buf1, function (err, torrent) {
    t.error(err)
    var parsedTorrent = parseTorrent(torrent)

    t.ok(parsedTorrent.name.indexOf('Unnamed Torrent') >= 0)

    t.equal(parsedTorrent.files.length, 1)
    t.ok(parsedTorrent.files[0].name.indexOf('Unnamed Torrent') >= 0)
    t.ok(parsedTorrent.files[0].path.indexOf('Unnamed Torrent') >= 0)
  })
})

test('implicit file name from torrent name', function (t) {
  t.plan(5)

  var buf1 = Buffer.from('buf1')

  createTorrent(buf1, { name: 'My Cool File' }, function (err, torrent) {
    t.error(err)
    var parsedTorrent = parseTorrent(torrent)

    t.equal(parsedTorrent.name, 'My Cool File')

    t.equal(parsedTorrent.files.length, 1)
    t.equal(parsedTorrent.files[0].name, 'My Cool File')
    t.equal(parsedTorrent.files[0].path, 'My Cool File')
  })
})

test('implicit torrent name from file name', function (t) {
  t.plan(5)

  var buf1 = Buffer.from('buf1')
  buf1.name = 'My Cool File'

  createTorrent(buf1, function (err, torrent) {
    t.error(err)
    var parsedTorrent = parseTorrent(torrent)

    t.equal(parsedTorrent.name, 'My Cool File')

    t.equal(parsedTorrent.files.length, 1)
    t.equal(parsedTorrent.files[0].name, 'My Cool File')
    t.equal(parsedTorrent.files[0].path, 'My Cool File')
  })
})

test('implicit file names from torrent name', function (t) {
  t.plan(7)

  var buf1 = Buffer.from('buf1')
  var buf2 = Buffer.from('buf2')

  createTorrent([buf1, buf2], { name: 'My Cool File' }, function (err, torrent) {
    t.error(err)
    var parsedTorrent = parseTorrent(torrent)

    t.equal(parsedTorrent.name, 'My Cool File')

    t.equal(parsedTorrent.files.length, 2)

    t.ok(parsedTorrent.files[0].name.indexOf('Unknown File') >= 0)
    t.ok(parsedTorrent.files[0].path.indexOf('Unknown File') >= 0)

    t.ok(parsedTorrent.files[1].name.indexOf('Unknown File') >= 0)
    t.ok(parsedTorrent.files[1].path.indexOf('Unknown File') >= 0)
  })
})

test('set file name with `name` property', function (t) {
  t.plan(5)

  var buf1 = Buffer.from('buf1')
  buf1.name = 'My Cool File'

  createTorrent(buf1, function (err, torrent) {
    t.error(err)
    var parsedTorrent = parseTorrent(torrent)

    t.equal(parsedTorrent.name, 'My Cool File')

    t.equal(parsedTorrent.files.length, 1)
    t.equal(parsedTorrent.files[0].name, 'My Cool File')
    t.equal(parsedTorrent.files[0].path, 'My Cool File')
  })
})

test('set file names with `name` property', function (t) {
  t.plan(7)

  var buf1 = Buffer.from('buf1')
  buf1.name = 'My Cool File 1'

  var buf2 = Buffer.from('buf2')
  buf2.name = 'My Cool File 2'

  createTorrent([buf1, buf2], { name: 'My Cool Torrent' }, function (err, torrent) {
    t.error(err)
    var parsedTorrent = parseTorrent(torrent)

    t.equal(parsedTorrent.name, 'My Cool Torrent')

    t.equal(parsedTorrent.files.length, 2)

    t.equal(parsedTorrent.files[0].name, 'My Cool File 1')
    t.equal(parsedTorrent.files[0].path, path.join('My Cool Torrent', 'My Cool File 1'))

    t.equal(parsedTorrent.files[1].name, 'My Cool File 2')
    t.equal(parsedTorrent.files[1].path, path.join('My Cool Torrent', 'My Cool File 2'))
  })
})

test('set file name with `fullPath` property', function (t) {
  t.plan(5)

  var buf1 = Buffer.from('buf1')
  buf1.fullPath = 'My Cool File'

  createTorrent(buf1, function (err, torrent) {
    t.error(err)
    var parsedTorrent = parseTorrent(torrent)

    t.equal(parsedTorrent.name, 'My Cool File')

    t.equal(parsedTorrent.files.length, 1)
    t.equal(parsedTorrent.files[0].name, 'My Cool File')
    t.equal(parsedTorrent.files[0].path, 'My Cool File')
  })
})

test('set file names with `fullPath` property', function (t) {
  t.plan(7)

  var buf1 = Buffer.from('buf1')
  buf1.fullPath = 'My Cool File 1'

  var buf2 = Buffer.from('buf2')
  buf2.fullPath = 'My Cool File 2'

  createTorrent([buf1, buf2], { name: 'My Cool Torrent' }, function (err, torrent) {
    t.error(err)
    var parsedTorrent = parseTorrent(torrent)

    t.equal(parsedTorrent.name, 'My Cool Torrent')

    t.equal(parsedTorrent.files.length, 2)

    t.equal(parsedTorrent.files[0].name, 'My Cool File 1')
    t.equal(parsedTorrent.files[0].path, path.join('My Cool Torrent', 'My Cool File 1'))

    t.equal(parsedTorrent.files[1].name, 'My Cool File 2')
    t.equal(parsedTorrent.files[1].path, path.join('My Cool Torrent', 'My Cool File 2'))
  })
})

test('implicit torrent name from file name with slashes in it', function (t) {
  t.plan(5)

  var buf1 = Buffer.from('buf1')
  buf1.name = 'My Cool Folder/My Cool File'

  createTorrent(buf1, function (err, torrent) {
    t.error(err)
    var parsedTorrent = parseTorrent(torrent)

    t.equal(parsedTorrent.name, 'My Cool File')

    t.equal(parsedTorrent.files.length, 1)
    t.equal(parsedTorrent.files[0].name, 'My Cool File')
    t.equal(parsedTorrent.files[0].path, 'My Cool File')
  })
})

test('implicit torrent name from file names with slashes in them', function (t) {
  t.plan(7)

  var buf1 = Buffer.from('buf1')
  buf1.name = 'My Cool Folder/My Cool File 1'

  var buf2 = Buffer.from('buf2')
  buf2.name = 'My Cool Folder/My Cool File 2'

  createTorrent([buf1, buf2], function (err, torrent) {
    t.error(err)
    var parsedTorrent = parseTorrent(torrent)

    t.equal(parsedTorrent.name, 'My Cool Folder')

    t.equal(parsedTorrent.files.length, 2)

    t.equal(parsedTorrent.files[0].name, 'My Cool File 1')
    t.equal(parsedTorrent.files[0].path, path.join('My Cool Folder', 'My Cool File 1'))

    t.equal(parsedTorrent.files[1].name, 'My Cool File 2')
    t.equal(parsedTorrent.files[1].path, path.join('My Cool Folder', 'My Cool File 2'))
  })
})
