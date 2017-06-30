# render-media [![Build Status][travis-image]][travis-url] [![NPM Version][npm-image]][npm-url] [![NPM Downloads][downloads-image]][downloads-url]

#### Intelligently render media files in the browser

[![Sauce Test Status](https://saucelabs.com/browser-matrix/render-media.svg)](https://saucelabs.com/u/render-media)

Show the file in a the browser by appending it to the DOM. This is a powerful
package that handles many file types like video (.mp4, .webm, .m4v, etc.), audio
(.m4a, .mp3, .wav, etc.), images (.jpg, .gif, .png, etc.), and other file formats
(.pdf, .md, .txt, etc.).

The file will be streamed into the page (if it's video or audio). Seeking the media
element will request a different byte range from the incoming file-like object.

In some cases, video or audio files will not be streamable because they're not in a
format that the browser can stream, so the file will be fully downloaded before being
played. For other non-streamable file types like images and PDFs, the file will be
downloaded then displayed.

This module is used by [WebTorrent](https://webtorrent.io).

### install

```
npm install render-media
```

### usage

```js
var render = require('render-media')
var from = require('from2')

var img = new Buffer('some jpg image data')

var file = {
  name: 'cat.jpg',
  createReadStream: function (opts) {
    if (!opts) opts = {}
    return from([ img.slice(opts.start || 0, opts.end || (img.length - 1)) ])
  }
}

render.append(file, 'body', function (err, elem) {
  if (err) return console.error(err.message)

  console.log(elem) // this is the newly created element with the media in it
})
```

### api

#### `render.append(file, rootElem, [opts], [function callback (err, elem) {}])`

`file` is an object with a `name` (string, with file extension) and `createReadStream`
method which provides the file data.

Here's an example file:

```js
var file = {
  name: 'file.mp4'
  createReadStream: function (opts) {
    var start = opts.start
    var end = opts.end
    // Return a readable stream that provides the bytes between offsets "start"
    // and "end" inclusive. This works just like fs.createReadStream(opts) from
    // the node.js "fs" module.
  }
}
```

An optional `file.length` property can also be set to specify the length of the
file in bytes. This will ensure that `render-media` does not attempt to load large
files (>200 MB by default) into memory, which it does in the "blob" strategy. (See discussion
of strategies below.)

`rootElem` is a container element (CSS selector or reference to DOM node) that the
content will be shown in. A new DOM node will be created for the content and
appended to `rootElem`.

If provided, `opts` can contain the following options:

- `autoplay`: Autoplay video/audio files (default: `true`)
- `controls`: Show video/audio player controls (default: `true`)
- `maxBlobLength`: Files above this size will skip the "blob" strategy and fail (default: `200 * 1000 * 1000` bytes)

If provided, `callback` will be called once the file is visible to the user.
`callback` is called with an `Error` (or `null`) and the new DOM node that is
displaying the content.

#### `render.render(file, elem, [function callback (err, elem) {}])`

Like `render.append` but renders directly into given element (or CSS selector).


### why does video/audio streaming not work on file X?

Streaming support depends on support for `MediaSource` API in the browser. All
modern browsers have `MediaSource` support.

Many file types are supported (again, depending on browser support), but only `.mp4`,
`.m4v`, and `.m4a` have full support, including seeking.

### rendering strategies

For video and audio, `render-media` tries multiple methods of playing the file:

- [`videostream`][videostream] -- best option, supports streaming **with seeking**,
  but only works with MP4-based files for now (uses `MediaSource` API)
- [`mediasource`][mediasource] -- supports more formats, supports streaming
  **without seeking** (uses `MediaSource` API)
- Blob URL -- supports the most formats of all (anything the `<video>` tag supports
  from an http url), **with seeking**, but **does not support streaming** (entire
  file must be downloaded first)

[videostream]: https://www.npmjs.com/package/videostream
[mediasource]: https://www.npmjs.com/package/mediasource

The Blob URL strategy will not be attempted if the file is over
`opts.maxBlobLength` (200 MB by default) since it requires the entire file to be
downloaded before playback can start which gives the appearance of the `<video>`
tag being stalled. If you increase the size, be sure to indicate loading progress
to the user in the UI somehow.

For other media formats, like images, the file is just added to the DOM.

For text-based formats, like html files, pdfs, etc., the file is added to the DOM
via a sandboxed `<iframe>` tag.

### license

MIT. Copyright (c) [Feross Aboukhadijeh](http://feross.org).

[travis-image]: https://img.shields.io/travis/feross/render-media/master.svg
[travis-url]: https://travis-ci.org/feross/render-media
[npm-image]: https://img.shields.io/npm/v/render-media.svg
[npm-url]: https://npmjs.org/package/render-media
[downloads-image]: https://img.shields.io/npm/dm/render-media.svg
[downloads-url]: https://npmjs.org/package/render-media
