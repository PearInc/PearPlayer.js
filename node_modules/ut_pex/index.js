/* jshint camelcase: false */

// TODO: ipv6 support
// TODO: parse and send peer flags (currently unused)
// NOTE: addPeer should take in an optional second argument, flags
// TODO: destroy wire if peer sends PEX messages too frequently

var EventEmitter = require('events').EventEmitter
var compact2string = require('compact2string')
var string2compact = require('string2compact')
var bencode = require('bencode')
var inherits = require('inherits')

var PEX_INTERVAL = 65000 // just over one minute
var PEX_MAX_PEERS = 50    // max number of peers to advertise per PEX message

module.exports = function () {
  inherits(utPex, EventEmitter)

  function utPex (wire) {
    var self = this
    EventEmitter.call(self)

    self._wire = wire
    self._intervalId = null

    self.reset()
  }

  utPex.prototype.name = 'ut_pex'

  /**
   * Start sending regular PEX updates to remote peer.
   */
  utPex.prototype.start = function () {
    var self = this
    clearInterval(self._intervalId)
    self._intervalId = setInterval(self._sendMessage.bind(self), PEX_INTERVAL)
    if (self._intervalId.unref) self._intervalId.unref()
  }

  /**
   * Stop sending PEX updates to the remote peer.
   */
  utPex.prototype.stop = function () {
    var self = this
    clearInterval(self._intervalId)
    self._intervalId = null
  }

  /**
   * Stops sending updates to the remote peer and resets internal state of peers seen.
   */
  utPex.prototype.reset = function () {
    var self = this
    self._remoteAddedPeers = {}
    self._remoteDroppedPeers = {}
    self._localAddedPeers = {}
    self._localDroppedPeers = {}
    self.stop()
  }

  /**
   * Adds a peer to the locally discovered peer list for the next PEX message.
   */
  utPex.prototype.addPeer = function (peer) {
    var self = this
    if (peer.indexOf(':') < 0) return // disregard invalid peers
    if (peer in self._remoteAddedPeers) return // never advertise peer the remote wire already sent us
    if (peer in self._localDroppedPeers) delete self._localDroppedPeers[peer]
    self._localAddedPeers[peer] = true
  }

  /**
   * Adds a peer to the locally dropped peer list for the next PEX message.
   */
  utPex.prototype.dropPeer = function (peer) {
    var self = this
    if (peer.indexOf(':') < 0) return // disregard invalid peers
    if (peer in self._remoteDroppedPeers) return // never advertise peer the remote wire already sent us
    if (peer in self._localAddedPeers) delete self._localAddedPeers[peer]
    self._localDroppedPeers[peer] = true
  }

  utPex.prototype.onExtendedHandshake = function (handshake) {
    var self = this
    if (!handshake.m || !handshake.m.ut_pex) {
      return self.emit('warning', new Error('Peer does not support ut_pex'))
    }
  }

  /**
   * PEX messages are bencoded dictionaries with the following keys:
   * 'added'     : array of peers met since last PEX message
   * 'added.f'   : array of flags per peer
   *  '0x01'     : peer prefers encryption
   *  '0x02'     : peer is seeder
   * 'dropped'   : array of peers locally dropped from swarm since last PEX message
   * 'added6'    : ipv6 version of 'added'
   * 'added6.f'  : ipv6 version of 'added.f'
   * 'dropped.f' : ipv6 version of 'dropped'
   *
   * @param {Buffer} buf bencoded PEX dictionary
   */
  utPex.prototype.onMessage = function (buf) {
    var self = this
    var message

    try {
      message = bencode.decode(buf)
    } catch (err) {
      // drop invalid messages
      return
    }

    if (message.added) {
      compact2string.multi(message.added).forEach(function (peer) {
        delete self._remoteDroppedPeers[peer]
        if (!(peer in self._remoteAddedPeers)) {
          self._remoteAddedPeers[peer] = true
          self.emit('peer', peer)
        }
      })
    }

    if (message.dropped) {
      compact2string.multi(message.dropped).forEach(function (peer) {
        delete self._remoteAddedPeers[peer]
        if (!(peer in self._remoteDroppedPeers)) {
          self._remoteDroppedPeers[peer] = true
          self.emit('dropped', peer)
        }
      })
    }
  }

  /**
   * Sends a PEX message to the remote peer including information about any locally
   * added / dropped peers.
   */
  utPex.prototype._sendMessage = function () {
    var self = this

    var localAdded = Object.keys(self._localAddedPeers).slice(0, PEX_MAX_PEERS)
    var localDropped = Object.keys(self._localDroppedPeers).slice(0, PEX_MAX_PEERS)

    var added = Buffer.concat(localAdded.map(string2compact))
    var dropped = Buffer.concat(localDropped.map(string2compact))

    var addedFlags = Buffer.concat(localAdded.map(function () {
      // TODO: support flags
      return Buffer.from([0])
    }))

    // update local deltas
    localAdded.forEach(function (peer) { delete self._localAddedPeers[peer] })
    localDropped.forEach(function (peer) { delete self._localDroppedPeers[peer] })

    // send PEX message
    self._wire.extended('ut_pex', {
      'added': added,
      'added.f': addedFlags,
      'dropped': dropped,
      'added6': Buffer.alloc(0),
      'added6.f': Buffer.alloc(0),
      'dropped6': Buffer.alloc(0)
    })
  }

  return utPex
}
