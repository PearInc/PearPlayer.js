var bencode = require('bencode')
var BitField = require('bitfield')
var Buffer = require('safe-buffer').Buffer
var debug = require('debug')('ut_metadata')
var EventEmitter = require('events').EventEmitter
var inherits = require('inherits')
var sha1 = require('simple-sha1')

var MAX_METADATA_SIZE = 10000000 // 10MB
var BITFIELD_GROW = 1000
var PIECE_LENGTH = 16 * 1024

module.exports = function (metadata) {
  inherits(utMetadata, EventEmitter)

  function utMetadata (wire) {
    EventEmitter.call(this)

    this._wire = wire

    this._metadataComplete = false
    this._metadataSize = null
    this._remainingRejects = null // how many reject messages to tolerate before quitting
    this._fetching = false

    // The largest .torrent file that I know of is ~1-2MB, which is ~100 pieces.
    // Therefore, cap the bitfield to 10x that (1000 pieces) so a malicious peer can't
    // make it grow to fill all memory.
    this._bitfield = new BitField(0, { grow: BITFIELD_GROW })

    if (Buffer.isBuffer(metadata)) {
      this.setMetadata(metadata)
    }
  }

  // Name of the bittorrent-protocol extension
  utMetadata.prototype.name = 'ut_metadata'

  utMetadata.prototype.onHandshake = function (infoHash, peerId, extensions) {
    this._infoHash = infoHash
  }

  utMetadata.prototype.onExtendedHandshake = function (handshake) {
    if (!handshake.m || !handshake.m.ut_metadata) {
      return this.emit('warning', new Error('Peer does not support ut_metadata'))
    }
    if (!handshake.metadata_size) {
      return this.emit('warning', new Error('Peer does not have metadata'))
    }
    if (typeof handshake.metadata_size !== 'number' ||
        MAX_METADATA_SIZE < handshake.metadata_size ||
        handshake.metadata_size <= 0) {
      return this.emit('warning', new Error('Peer gave invalid metadata size'))
    }

    this._metadataSize = handshake.metadata_size
    this._numPieces = Math.ceil(this._metadataSize / PIECE_LENGTH)
    this._remainingRejects = this._numPieces * 2

    if (this._fetching) {
      this._requestPieces()
    }
  }

  utMetadata.prototype.onMessage = function (buf) {
    var dict, trailer
    try {
      var str = buf.toString()
      var trailerIndex = str.indexOf('ee') + 2
      dict = bencode.decode(str.substring(0, trailerIndex))
      trailer = buf.slice(trailerIndex)
    } catch (err) {
      // drop invalid messages
      return
    }

    switch (dict.msg_type) {
      case 0:
        // ut_metadata request (from peer)
        // example: { 'msg_type': 0, 'piece': 0 }
        this._onRequest(dict.piece)
        break
      case 1:
        // ut_metadata data (in response to our request)
        // example: { 'msg_type': 1, 'piece': 0, 'total_size': 3425 }
        this._onData(dict.piece, trailer, dict.total_size)
        break
      case 2:
        // ut_metadata reject (peer doesn't have piece we requested)
        // { 'msg_type': 2, 'piece': 0 }
        this._onReject(dict.piece)
        break
    }
  }

  /**
   * Ask the peer to send metadata.
   * @public
   */
  utMetadata.prototype.fetch = function () {
    if (this._metadataComplete) {
      return
    }
    this._fetching = true
    if (this._metadataSize) {
      this._requestPieces()
    }
  }

  /**
   * Stop asking the peer to send metadata.
   * @public
   */
  utMetadata.prototype.cancel = function () {
    this._fetching = false
  }

  utMetadata.prototype.setMetadata = function (metadata) {
    if (this._metadataComplete) return true
    debug('set metadata')

    // if full torrent dictionary was passed in, pull out just `info` key
    try {
      var info = bencode.decode(metadata).info
      if (info) {
        metadata = bencode.encode(info)
      }
    } catch (err) {}

    // check hash
    if (this._infoHash && this._infoHash !== sha1.sync(metadata)) {
      return false
    }

    this.cancel()

    this.metadata = metadata
    this._metadataComplete = true
    this._metadataSize = this.metadata.length
    this._wire.extendedHandshake.metadata_size = this._metadataSize

    this.emit('metadata', bencode.encode({ info: bencode.decode(this.metadata) }))

    return true
  }

  utMetadata.prototype._send = function (dict, trailer) {
    var buf = bencode.encode(dict)
    if (Buffer.isBuffer(trailer)) {
      buf = Buffer.concat([buf, trailer])
    }
    this._wire.extended('ut_metadata', buf)
  }

  utMetadata.prototype._request = function (piece) {
    this._send({ msg_type: 0, piece: piece })
  }

  utMetadata.prototype._data = function (piece, buf, totalSize) {
    var msg = { msg_type: 1, piece: piece }
    if (typeof totalSize === 'number') {
      msg.total_size = totalSize
    }
    this._send(msg, buf)
  }

  utMetadata.prototype._reject = function (piece) {
    this._send({ msg_type: 2, piece: piece })
  }

  utMetadata.prototype._onRequest = function (piece) {
    if (!this._metadataComplete) {
      this._reject(piece)
      return
    }
    var start = piece * PIECE_LENGTH
    var end = start + PIECE_LENGTH
    if (end > this._metadataSize) {
      end = this._metadataSize
    }
    var buf = this.metadata.slice(start, end)
    this._data(piece, buf, this._metadataSize)
  }

  utMetadata.prototype._onData = function (piece, buf, totalSize) {
    if (buf.length > PIECE_LENGTH) {
      return
    }
    buf.copy(this.metadata, piece * PIECE_LENGTH)
    this._bitfield.set(piece)
    this._checkDone()
  }

  utMetadata.prototype._onReject = function (piece) {
    if (this._remainingRejects > 0 && this._fetching) {
      // If we haven't been rejected too much, then try to request the piece again
      this._request(piece)
      this._remainingRejects -= 1
    } else {
      this.emit('warning', new Error('Peer sent "reject" too much'))
    }
  }

  utMetadata.prototype._requestPieces = function () {
    this.metadata = Buffer.alloc(this._metadataSize)
    for (var piece = 0; piece < this._numPieces; piece++) {
      this._request(piece)
    }
  }

  utMetadata.prototype._checkDone = function () {
    var done = true
    for (var piece = 0; piece < this._numPieces; piece++) {
      if (!this._bitfield.get(piece)) {
        done = false
        break
      }
    }
    if (!done) return

    // attempt to set metadata -- may fail sha1 check
    var success = this.setMetadata(this.metadata)

    if (!success) {
      this._failedMetadata()
    }
  }

  utMetadata.prototype._failedMetadata = function () {
    // reset bitfield & try again
    this._bitfield = new BitField(0, { grow: BITFIELD_GROW })
    this._remainingRejects -= this._numPieces
    if (this._remainingRejects > 0) {
      this._requestPieces()
    } else {
      this.emit('warning', new Error('Peer sent invalid metadata'))
    }
  }

  return utMetadata
}
