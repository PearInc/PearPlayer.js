# uint64be

Encode / decode big endian unsigned 64 bit integers

```
npm install uint64be
```

[![build status](http://img.shields.io/travis/mafintosh/uint64be.svg?style=flat)](http://travis-ci.org/mafintosh/uint64be)

## Usage

``` js
var uint64be = require('uint64be')

var buf = uint64be.encode(42) // returns a 8 byte buffer with 42 encoded
console.log(uint64be.decode(buf)) // returns 42
```

## Notice

Javascript (currently) only supports integers up to `2^53 - 1` without any
loss of precision so beware of this if you encode / decode any integers larger than that.

## API

#### `buffer = uint64be.encode(num, [buffer], [offset])`

Encode a number as a big endian 64 bit unsigned integer.
Optionally you can pass a buffer + offset as the 2nd and 3rd argument
and the number will be encoded into that buffer at the given offset.

#### `num = uint64be.decode(buffer, [offset])`

Decode a number from a buffer.

#### `length = uint64be.encodingLength(num)`

Always returns `8`. Added to comply with the standard encoding interface in node.
Similarly `uint64be.encode.bytes` and `uint64be.decode.bytes` is also set to `8`.

## License

MIT
