# torrent-discovery [![travis][travis-image]][travis-url] [![npm][npm-image]][npm-url] [![downloads][downloads-image]][downloads-url] [![javascript style guide][standard-image]][standard-url]

[travis-image]: https://img.shields.io/travis/webtorrent/torrent-discovery/master.svg
[travis-url]: https://travis-ci.org/webtorrent/torrent-discovery
[npm-image]: https://img.shields.io/npm/v/torrent-discovery.svg
[npm-url]: https://npmjs.org/package/torrent-discovery
[downloads-image]: https://img.shields.io/npm/dm/torrent-discovery.svg
[downloads-url]: https://npmjs.org/package/torrent-discovery
[standard-image]: https://img.shields.io/badge/code_style-standard-brightgreen.svg
[standard-url]: https://standardjs.com

### Discover BitTorrent and WebTorrent peers

This module bundles [bittorrent-dht](https://www.npmjs.com/package/bittorrent-dht) and
[bittorrent-tracker](https://www.npmjs.com/package/bittorrent-tracker) clients and exposes a
single API for discovering BitTorrent peers via both discovery methods.

## features

- simple API
- find peers from trackers and the DHT
- automatically announces, so other peers can discover us
- can start finding peers with just an info hash, before full metadata is available

This module also **works in the browser** with [browserify](http://browserify.org). In
that context, it discovers [WebTorrent](http://webtorrent.io) (WebRTC) peers.

## install

```
npm install torrent-discovery
```

## api

### `discovery = new Discovery(opts)`

Create a new peer discovery instance. Required options are:

```js
{
  infoHash: '', // as hex string or Buffer
  peerId: '',   // as hex string or Buffer
  port: 0       // torrent client port (only required in node)
}
```

Optional options are:

```js
{
  announce: [],  // force list of announce urls to use (from magnet uri)
  dht: true,     // use dht? optionally, this can be an `opts` object, or a DHT instance to use (can be reused for multiple torrents)
  dhtPort: 0,    // custom listen port for the DHT instance (not used if DHT instance is given via `opts.dht`)
  userAgent: '', // User-Agent header for http requests
  tracker: true, // use trackers? optionally, this can be an `opts` object
}
```

See the documentation for [bittorrent-dht](https://www.npmjs.com/package/bittorrent-dht) and
[bittorrent-tracker](https://www.npmjs.com/package/bittorrent-tracker) for information on what
options are available via the `opts` object.

**This module automatically handles announcing on intervals, for maximum peer discovery.**

### `discovery.updatePort(port)`

When the port that the torrent client is listening on changes, call this method to
reannounce to the tracker and DHT with the new port.

### `discovery.complete([opts])`

Announce that download has completed (and the client is now a seeder). This is only
used by trackers, for statistical purposes. If trackers are not in use, then
this method is a no-op.

Optional `opts` object with the following options:

```
{number=} opts.uploaded
{number=} opts.downloaded
{number=} opts.numwant
{number=} opts.left (if not set, calculated automatically)
```

### `discovery.destroy()`

Destroy and cleanup the DHT and tracker instances.

### events

### `discovery.on('peer', function (peer, source) {})`

Emitted whenever a new peer is discovered. Source is either 'tracker' or 'dht' based on peer source.

**In node**, `peer` is a string in the form `12:34:56:78:4000`.

**In the browser**, `peer` is an instance of
[`simple-peer`](https://www.npmjs.com/package/simple-peer), a small wrapper around a WebRTC
peer connection.

### `discovery.on('dhtAnnounce', function () {})`

Emitted whenever an `announce` message has been sent to the DHT.

### `discovery.on('warning', function (err) {})`

Emitted when there is a non-fatal DHT or tracker error, like an inaccessible tracker
server. Useful for logging. This is non-fatal.

### `discovery.on('error', function (err) {})`

Emitted when there is a fatal, unrecoverable DHT or tracker error.

## license

MIT. Copyright (c) [Feross Aboukhadijeh](https://feross.org) and [WebTorrent, LLC](https://webtorrent.io).

