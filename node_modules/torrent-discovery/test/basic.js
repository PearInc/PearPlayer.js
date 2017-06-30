var Discovery = require('../')
var DHT = require('bittorrent-dht')
var randombytes = require('randombytes')
var test = require('tape')

test('initialize with dht', function (t) {
  t.plan(1)
  var dht = new DHT()
  var discovery = new Discovery({
    infoHash: randombytes(20),
    peerId: randombytes(20),
    port: 6000,
    dht: dht
  })
  discovery.destroy(function () {
    dht.destroy(function () {
      t.pass()
    })
  })
})

test('initialize with default dht', function (t) {
  t.plan(1)
  var discovery = new Discovery({
    infoHash: randombytes(20),
    peerId: randombytes(20),
    port: 6000
  })
  discovery.destroy(function () {
    t.pass()
  })
})

test('initialize without dht', function (t) {
  t.plan(2)
  var discovery = new Discovery({
    infoHash: randombytes(20),
    peerId: randombytes(20),
    port: 6000,
    dht: false
  })
  t.equal(discovery.dht, null)
  discovery.destroy(function () {
    t.pass()
  })
})
