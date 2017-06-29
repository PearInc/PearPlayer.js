# bittorrent-protocol [![travis][travis-image]][travis-url] [![npm][npm-image]][npm-url] [![downloads][downloads-image]][downloads-url] [![javascript style guide][standard-image]][standard-url]

[travis-image]: https://img.shields.io/travis/webtorrent/bittorrent-protocol/master.svg
[travis-url]: https://travis-ci.org/webtorrent/bittorrent-protocol
[npm-image]: https://img.shields.io/npm/v/bittorrent-protocol.svg
[npm-url]: https://npmjs.org/package/bittorrent-protocol
[downloads-image]: https://img.shields.io/npm/dm/bittorrent-protocol.svg
[downloads-url]: https://npmjs.org/package/bittorrent-protocol
[standard-image]: https://img.shields.io/badge/code_style-standard-brightgreen.svg
[standard-url]: https://standardjs.com

### Simple, robust, BitTorrent wire protocol implementation

[![Sauce Test Status](https://saucelabs.com/browser-matrix/bittorrent-protocol.svg)](https://saucelabs.com/u/bittorrent-protocol)

Node.js implementation of the [BitTorrent peer wire protocol](https://wiki.theory.org/BitTorrentSpecification#Peer_wire_protocol_.28TCP.29).
The protocol is the main communication layer for BitTorrent file transfer.

Also works in the browser with [browserify](http://browserify.org/)! This module is used
by [WebTorrent](http://webtorrent.io).

## install

```
npm install bittorrent-protocol
```

## usage

The protocol is implemented as a **duplex stream**, so all you have to do is pipe to and
from it.

duplex streams | a.pipe(b).pipe(a)
---- | ---
![duplex streams](https://raw.github.com/substack/lxjs-stream-examples/master/images/duplex_streams.png) | ![a.pipe(b).pipe(a)](https://raw.github.com/substack/lxjs-stream-examples/master/images/a_pipe_b_pipe_a.png)

(Images from the ["harnessing streams"](https://github.com/substack/lxjs-stream-examples/blob/master/slides.markdown) talk by substack.)

```js
var Protocol = require('bittorrent-protocol')
var net = require('net')

net.createServer(function (socket) {
	var wire = new Protocol()

	// pipe to and from the protocol
	socket.pipe(wire).pipe(socket)

	wire.on('handshake', function (infoHash, peerId) {
    // receive a handshake (infoHash and peerId are hex strings)

		// lets emit a handshake of our own as well
		wire.handshake('my info hash (hex)', 'my peer id (hex)')
	})

	wire.on('unchoke', function () {
		console.log('peer is no longer choking us: ' + wire.peerChoking)
	})
}).listen(6881)
```

## methods

### handshaking

Send and receive a handshake from the peer. This is the first message.

```js
// send a handshake to the peer
wire.handshake(infoHash, peerId, { dht: true })
wire.on('handshake', function (infoHash, peerId, extensions) {
	// receive a handshake (infoHash and peerId are hex strings)
  console.log(extensions.dht) // supports DHT (BEP-0005)
  console.log(extensions.extended) // supports extension protocol (BEP-0010)
})
```

For `wire.handshake()`, the `infoHash` and the `peerId` should be 20 bytes (hex-encoded `string` or `Buffer`).

### choking

Check if you or the peer is choking.

```js
wire.peerChoking // is the peer choking us?
wire.amChoking // are we choking the peer?

wire.on('choke', function () {
	// the peer is now choking us
})
wire.on('unchoke', function () {
	// peer is no longer choking us
})
```

### interested

See if you or the peer is interested.

```js
wire.peerInterested // is the peer interested in us?
wire.amInterested // are we interested in the peer?

wire.on('interested', function () {
	// peer is now interested
})
wire.on('uninterested', function () {
	// peer is no longer interested
})
```

### bitfield

Exchange piece information with the peer.

```js
// send a bitfield to the peer
wire.bitfield(buffer)
wire.on('bitfield', function (bitfield) {
	// bitfield received from the peer
})

// send a have message indicating that you have a piece
wire.have(pieceIndex)
wire.on('have', function (pieceIndex) {
	// peer has sent you a have message
})
```

You can always see which pieces the peer has

```js
wire.peerPieces.get(i) // returns true if peer has piece i
```

`wire.peerPieces` is a `BitField`, see [docs](https://www.npmjs.org/package/bitfield).

### requests

Send and respond to requests for pieces.

```js
// request a block from a peer
wire.request(pieceIndex, offset, length, function (err, block) {
	if (err) {
		// there was an error (peer has started choking us etc)
		return
	}
	// got block
})

// cancel a request to a peer
wire.cancel(pieceIndex, offset, length)

// receive a request from a peer
wire.on('request', function (pieceIndex, offset, length, callback) {
	// ... read block ...
	callback(null, block) // respond back to the peer
})

wire.requests     // list of requests we currently have pending {piece, offset, length}
wire.peerRequests // list of requests the peer currently have pending {piece, offset, length}
```

You can set a request timeout if you want to.

```js
wire.setTimeout(5000) // head request should take a most 5s to finish
```

If the timeout is triggered the request callback is called with an error and a `timeout`
event is emitted.

### dht and port

You can set the extensions flag `dht` in the handshake to `true` if you participate in
the torrent dht. Afterwards you can send your dht port.

```js
// send your port to the peer
wire.port(dhtPort)
wire.on('port', function (dhtPort) {
	// peer has sent a port to us
})
```

You can check to see if the peer supports extensions.

```js
wire.peerExtensions.dht // supports DHT (bep_0005)
wire.peerExtensions.extended // supports extended messages (bep_0005)
```

### keep-alive

You can enable the keep-alive ping (triggered every 60s).

```js
// starts the keep alive
wire.setKeepAlive(true)
wire.on('keep-alive', function () {
	// peer sent a keep alive - just ignore it
})
```

### extension protocol (BEP 10)

This module has built-in support for the
[BitTorrent Extension Protocol (BEP 10)](http://www.bittorrent.org/beps/bep_0010.html).

The intention of BEP 10 is to provide a simple and thin transport for extensions to the
bittorrent protocol. Most extensions to the protocol use BEP 10 so they can add new
features to the protocol without interfering with the standard bittorrent protocol or
clients that don't support the new extension.

An example of a BitTorrent extension that uses BEP 10 is
[ut_metadata](http://www.bittorrent.org/beps/bep_0009.html) (BEP 9), the extension that
allows magnet uris to work.

```js
wire.extended(code, buffer)
```

This package, **bittorrent-protocol**, also provides an extension API to make it easy to
add extensions to this module using the "extension protocol" (BEP 10). For example, to
support ut_metadata (BEP 9), you need only install the
[ut_metadata](https://www.npmjs.com/package/ut_metadata) npm module and call `wire.use()`.
See the [Extension API](#extension-api) section for more information.

### transfer stats

Check how many bytes you have uploaded and download, and current speed

```js
wire.uploaded // number of bytes uploaded
wire.downloaded // number of bytes downloaded

wire.uploadSpeed() // upload speed - bytes per second
wire.downloadSpeed() // download speed - bytes per second

wire.on('download', function (numberOfBytes) {
  ...
})
wire.on('upload', function (numberOfBytes) {
  ...
})
```


## extension api

This package supports a simple extension API so you can extend the default protocol
functionality with common protocol extensions like ut_metadata (magnet uris).

Here are the **bittorrent-protocol** extensions that we know about:

- [ut_metadata](https://www.npmjs.com/package/ut_metadata) - Extension for Peers to Send Metadata Files (BEP 9)
- [ut_pex](https://www.npmjs.com/package/ut_pex) - Extension for Peer Discovery (PEX)
- *Add yours here! Send a pull request!*

In short, an extension can register itself with at a certain name, which will be added to
the extended protocol handshake sent to the remote peer. Extensions can also hook events
like 'handshake' and 'extended'. To use an extension, simply require it and call
`wire.use()`.

Here is an example of the **ut_metadata** extension being used with
**bittorrent-protocol**:

```js
var Protocol = require('bittorrent-protocol')
var net = require('net')
var ut_metadata = require('ut_metadata')

net.createServer(function (socket) {
  var wire = new Protocol()
  socket.pipe(wire).pipe(socket)

  // initialize the extension
  wire.use(ut_metadata())

  // all `ut_metadata` functionality can now be accessed at wire.ut_metadata

  // ask the peer to send us metadata
  wire.ut_metadata.fetch()

  // 'metadata' event will fire when the metadata arrives and is verified to be correct!
  wire.ut_metadata.on('metadata', function (metadata) {
    // got metadata!

    // Note: the event will not fire if the peer does not support ut_metadata, if they
    // don't have metadata yet either, if they repeatedly send invalid data, or if they
    // simply don't respond.
  })

  // optionally, listen to the 'warning' event if you want to know that metadata is
  // probably not going to arrive for one of the above reasons.
  wire.ut_metadata.on('warning', function (err) {
    console.log(err.message)
  })

  // handle handshake
  wire.on('handshake', function (infoHash, peerId) {
    // receive a handshake (infoHash and peerId are hex strings)
    wire.handshake(new Buffer('my info hash'), new Buffer('my peer id'))
  })

}).listen(6881)
```

If you want to write your own extension, take a look at the
[ut_metadata index.js file](https://github.com/webtorrent/ut_metadata/blob/master/index.js)
to see how it's done.

## license

MIT. Copyright (c) [Feross Aboukhadijeh](https://feross.org), Mathias Buus, and [WebTorrent, LLC](https://webtorrent.io).
