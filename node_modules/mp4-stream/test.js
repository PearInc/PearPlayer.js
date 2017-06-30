var tape = require('tape')
var mp4 = require('./')

tape('generates and parses', function (t) {
  var encode = mp4.encode()
  var decode = mp4.decode()

  decode.on('box', function (headers) {
    if (headers.type === 'ftyp') {
      decode.decode(function (box) {
        t.same(box.type, 'ftyp')
        t.same(box.brand, 'mafi')
        t.same(box.brandVersion, 1)
      })
    } else if (headers.type === 'mdat') {
      t.same(headers.type, 'mdat')
      t.same(headers.length, 8 + 11)
      var buffer = []
      var stream = decode.stream()
      stream.on('data', function (data) {
        buffer.push(data)
      })
      stream.on('end', function () {
        t.same(Buffer.concat(buffer).toString(), 'hello world')
        t.end()
      })
    } else {
      t.fail('unexpected box')
    }
  })

  encode.box({
    type: 'ftyp',
    brand: 'mafi',
    brandVersion: 1
  })

  var stream = encode.mediaData(11)
  stream.end('hello world')

  encode.finalize()
  encode.pipe(decode)
})

tape('generates and parses with decoder/encoder in between', function (t) {
  var encode = mp4.encode()
  var decode = mp4.decode()
  var encode2 = mp4.encode()
  var decode2 = mp4.decode()

  decode.on('box', function (headers) {
    if (headers.type === 'ftyp') {
      decode.decode(function (box) {
        t.same(box.type, 'ftyp')
        t.same(box.brand, 'mafi')
        t.same(box.brandVersion, 1)
      })
    } else if (headers.type === 'mdat') {
      t.same(headers.type, 'mdat')
      t.same(headers.length, 8 + 11)
      var buffer = []
      var stream = decode.stream()
      stream.on('data', function (data) {
        buffer.push(data)
      })
      stream.on('end', function () {
        t.same(Buffer.concat(buffer).toString(), 'hello world')
        t.end()
      })
    } else {
      t.fail('unexpected box')
    }
  })

  encode.box({
    type: 'ftyp',
    brand: 'mafi',
    brandVersion: 1
  })

  var stream = encode.mediaData(11)
  stream.end('hello world')

  encode.finalize()
  encode.pipe(decode2)
  decode2.on('box', function (headers) {
    decode2.decode(function (box) {
      encode2.box(box)
    })
  })
  decode2.on('end', function () {
    encode2.finalize()
  })
  encode2.pipe(decode)
})
