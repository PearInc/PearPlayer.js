# mediasource [![travis][travis-image]][travis-url] [![npm][npm-image]][npm-url] [![downloads][downloads-image]][downloads-url]

[travis-image]: https://img.shields.io/travis/feross/mediasource/master.svg
[travis-url]: https://travis-ci.org/feross/mediasource
[npm-image]: https://img.shields.io/npm/v/mediasource.svg
[npm-url]: https://npmjs.org/package/mediasource
[downloads-image]: https://img.shields.io/npm/dm/mediasource.svg
[downloads-url]: https://npmjs.org/package/mediasource

### MediaSource API as a node.js Writable stream

[![Sauce Test Status](https://saucelabs.com/browser-matrix/mediasource.svg)](https://saucelabs.com/u/mediasource)

Stream video/audio into a `<video>` or `<audio>` tag by attaching node.js Writable streams.

This package is used by [WebTorrent](http://webtorrent.io) (along with other approaches)
to support media streaming.

## install

```
npm install mediasource
```

## usage

```js
var MediaElementWrapper = require('mediasource')

function createElem (tagName) {
  var elem = document.createElement(tagName)
  elem.controls = true
  elem.autoplay = true // for chrome
  elem.play() // for firefox
  document.body.appendChild(elem)
  return elem
}

var elem = createElem('video')

var readable = // ... get a readable stream from somewhere
var wrapper = new MediaElementWrapper(elem)
// The correct mime type, including codecs, must be provided
var writable = wrapper.createWriteStream('video/webm; codecs="vorbis, vp8"')

elem.addEventListener('error', function () {
  // listen for errors on the video/audio element directly
  var errorCode = elem.error
  var detailedError = wrapper.detailedError
  // wrapper.detailedError will often have a more detailed error message
})

writable.on('error', function (err) {
  // listening to the stream 'error' event is optional
})

readable.pipe(writable)

// media should start playing now!
```

### advanced usage

`wrapper.createWriteStream()` can be called multiple times if different tracks (e.g. audio and video) need to
be passed in separate streams. Each call should be made with the correct mime type.

Instead of a mime type, an existing MediaSourceStream (as returned by `wrapper.createWriteStream()`) can be
passed as the single argument to `wrapper.createWriteStream()`, which will cause the existing stream to be
replaced by the newly returned stream. This is useful when you want to cancel the existing stream
and replace it with a new one, e.g. when seeking.

### options

#### opts.bufferDuration

Specify how many seconds of media should be put into the browser's buffer before applying backpressure.

### errors

Handle errors by listening to the `'error'` event on the `<video>` or `<audio>` tag.

Some (but not all) errors will also cause `wrapper.detailedError` to be set to an error value that has
a more informative error message.

## license

MIT. Copyright (c) [Feross Aboukhadijeh](http://feross.org).
