[![abstract-encoding](https://img.shields.io/badge/abstract--encoding-compliant-brightgreen.svg?style=flat)](https://github.com/mafintosh/abstract-encoding)

# mp4-box-encoding

This module provides encoders and decoders with the
[abstract encoding](https://github.com/mafintosh/abstract-encoding) interface.

The module exports the interface for a generic box, including all headers and
children (for container boxes) Encodings for many leaf (non-container) boxes,
without headers, is available keyed by the box type:

``` js
var box = require('mp4-box-encoding')

var buffer = fs.readFileSync('myvideo.mp4')
// decode any box including headers
// decode the entire moov box and its children
var moov = box.decode(buffer.slice(24, 236989))

var moov.mfhd.mtime = new Date() // Change the modification time

// now this is an encoding of the modified moov box
var moofBuffer = box.encode(moov)

// decode the contents of just the stts box
var stts = box.decode(buffer.slice(609, 625))
```

These encodings are factored out of [mp4-stream](https://github.com/mafintosh/mp4-stream).

## License

MIT