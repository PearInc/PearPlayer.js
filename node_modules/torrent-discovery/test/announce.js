var DHT = require('bittorrent-dht')
var Discovery = require('../')
var randombytes = require('randombytes')
var test = require('tape')

test('initialize with dht', function (t) {
  t.plan(5)
  var dht = new DHT({ bootstrap: false })
  var discovery = new Discovery({
    infoHash: randombytes(20),
    peerId: randombytes(20),
    port: 6000,
    dht: dht,
    intervalMs: 1000
  })

  var _dhtAnnounce = discovery._dhtAnnounce
  var num = 0
  discovery._dhtAnnounce = function () {
    num += 1
    t.pass('called once after 1000ms')
    _dhtAnnounce.call(discovery)
    if (num === 4) {
      discovery.destroy(function () {
        dht.destroy(function () {
          t.pass()
        })
      })
    }
  }
})
