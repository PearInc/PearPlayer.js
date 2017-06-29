# stream-with-known-length-to-buffer [![Build Status][travis-image]][travis-url] [![NPM Version][npm-image]][npm-url] [![NPM Downloads][downloads-image]][downloads-url]

#### Convert a Readable Stream with a known length into a Buffer

[![Sauce Test Status](https://saucelabs.com/browser-matrix/stream-with-known-length-to-buffer.svg)](https://saucelabs.com/u/stream-with-known-length-to-buffer)

This package converts a Readable Stream into a Buffer, with just one Buffer
allocation (excluding allocations done internally by the streams implementation).

This is lighter-weight choice than
[`stream-to-array`](https://github.com/stream-utils/stream-to-array) when the
total stream length is known in advance. This whole package is 15 lines.

This module is used by [WebTorrent](https://webtorrent.io).

### install

```
npm install stream-with-known-length-to-buffer
```

### usage

```js
var toBuffer = require('stream-with-known-length-to-buffer')

toBuffer(fs.createReadStream('file.txt'), 1000, function (err, buf) {
  if (err) return console.error(err.message)
  console.log(buf)
})
```

### license

MIT. Copyright (c) [Feross Aboukhadijeh](http://feross.org).

[travis-image]: https://img.shields.io/travis/feross/stream-with-known-length-to-buffer.svg?style=flat
[travis-url]: https://travis-ci.org/feross/stream-with-known-length-to-buffer
[npm-image]: https://img.shields.io/npm/v/stream-with-known-length-to-buffer.svg?style=flat
[npm-url]: https://npmjs.org/package/stream-with-known-length-to-buffer
[downloads-image]: https://img.shields.io/npm/dm/stream-with-known-length-to-buffer.svg?style=flat
[downloads-url]: https://npmjs.org/package/stream-with-known-length-to-buffer
