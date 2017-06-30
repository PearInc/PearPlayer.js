# mp4-stream

Streaming mp4 encoder and decoder

```
npm install mp4-stream
```

[![build status](http://img.shields.io/travis/mafintosh/mp4-stream.svg?style=flat)](http://travis-ci.org/mafintosh/mp4-stream)

## Usage

``` js
var mp4 = require('mp4-stream')
var fs = require('fs')

var decode = mp4.decode()

fs.createReadStream('video.mp4')
  .pipe(decode)
  .on('box', function (headers) {
    console.log('found box (' + headers.type + ') (' + headers.length + ')')
    if (headers.type === 'mdat') {
      // you can get the contents as a stream
      console.log('box has stream data (consume stream to continue)')
      decode.stream().resume()
    } else if (headers.type === 'moof') {
      // you can ignore some boxes
      decode.ignore()
    } else {
      // or you can fully decode them
      decode.decode(function (box) {
        console.log('box contents:', box)
      })
    }
  }
  })
```

All boxes have a type thats a 4 char string with a type name.

## API

#### `var stream = mp4.decode()`

Create a new decoder.

The decoder is a writable stream you should write a mp4 file to. It emits the following additional events:

* `on('box', headers)` - emitted when a new box is found.

Each time the `box` event fires, you must call one of these three functions:

* `stream.ignore()` - ignore the entire box and continue parsing after its end
* `stream.stream()` - get a readable stream of the box contents
* `stream.decode(callback)` - decode the box, including all childeren in the case of containers, and pass
the resulting box object to the callback

``` js
var fs = require('fs')
var stream = mp4.decode()

stream.on('box', function (headers) {
  console.log('found new box:', headers)
})

fs.createReadStream('my-video.mp4').pipe(stream)
```

#### `var stream = mp4.encode()`

Create a new encoder.

The encoder is a readable stream you can use to generate a mp4 file. It has the following API:

* `stream.box(box, [callback])` - adds a new mp4 box to the stream.
* `var ws = stream.mediaData(size)` - helper that adds an `mdat` box. write the media content to this stream.
* `stream.finalize()` - finalizes the mp4 stream. call this when you're done.

``` js
var fs = require('fs')
var stream = mp4.encode()

stream.pipe(fs.createWriteStream('my-new-video.mp4'))

stream.box(anMP4Box, function (err) {
  // box flushed

  var content = stream.mediaData(lengthOfStream, function () {
    // wrote media data
    stream.finalize()
  })

  someContent.pipe(content)
})

```

## Decode and encode a file

To decode and encode an mp4 file with this module do

``` js
var encoder = mp4.encode()
var decoder = mp4.decode()

decoder.on('box', function (headers) {
  decoder.decode(function (box) {
    encoder.box(box, next)
  })
})

fs.createReadStream('my-movie.mp4').pipe(decoder)
encoder.pipe(fs.createWriteStream('my-movie-copy.mp4'))
```

## Boxes

Mp4 supports a wide range of boxes, implemented in
[mp4-box-encoding](https://github.com/jhiesey/mp4-box-encoding).

## License

MIT
