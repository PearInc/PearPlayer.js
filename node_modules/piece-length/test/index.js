var run = require('tape').test
var piece = require('../')

var message = function(bytes, expected, pieces) {
  var target = (bytes < 1e9 ?
    ~~(bytes / Math.pow(2, 20)) + 'mb' :
    (bytes / Math.pow(2, 30)).toFixed(1) + 'gb'
  )

  var size = (expected < 1e6 ?
    expected / Math.pow(2, 10) + 'kb' :
    expected / Math.pow(2, 20) + 'mb'
  )

  return target + ' should be ' + size +
    ' pieces (' + pieces + ' total)'
}

run('4mb', function(test) {
  var bytes = 4 * Math.pow(2, 20)
  var result = piece(bytes)
  var expected = Math.pow(2, 14)
  var pieces = Math.ceil(bytes / expected)
  var log = message(bytes, expected, pieces)

  test.equal(result, expected, log)
  test.end()
})

run('50mb', function(test) {
  var bytes = 50 * Math.pow(2, 20)
  var result = piece(bytes)
  var expected = Math.pow(2, 16)
  var pieces = Math.ceil(bytes / expected)
  var log = message(bytes, expected, pieces)

  test.equal(result, expected, log)
  test.end()
})

run('130mb', function(test) {
  var bytes = 130 * Math.pow(2, 20)
  var result = piece(bytes)
  var expected = Math.pow(2, 17)
  var pieces = Math.ceil(bytes / expected)
  var log = message(bytes, expected, pieces)

  test.equal(result, expected, log)
  test.end()
})

run('350mb', function(test) {
  var bytes = 350 * Math.pow(2, 20)
  var result = piece(bytes)
  var expected = Math.pow(2, 18)
  var pieces = Math.ceil(bytes / expected)
  var log = message(bytes, expected, pieces)

  test.equal(result, expected, log)
  test.end()
})

run('700mb', function(test) {
  var bytes = 700 * Math.pow(2, 20)
  var result = piece(bytes)
  var expected = Math.pow(2, 19)
  var pieces = Math.ceil(bytes / expected)
  var log = message(bytes, expected, pieces)

  test.equal(result, expected, log)
  test.end()
})

run('1.4gb', function(test) {
  var bytes = 1.4 * Math.pow(2, 30)
  var result = piece(bytes)
  var expected = Math.pow(2, 20)
  var pieces = Math.ceil(bytes / expected)
  var log = message(bytes, expected, pieces)
 
  test.equal(result, expected, log)
  test.end()
})

run('2.5gb', function(test) {
  var bytes = 2.5 * Math.pow(2, 30)
  var result = piece(bytes)
  var expected = Math.pow(2, 21)
  var pieces = Math.ceil(bytes / expected)
  var log = message(bytes, expected, pieces)

  test.equal(result, expected, log)
  test.end()
})

run('4.5gb', function(test) {
  var bytes = 4.5 * Math.pow(2, 30)
  var result = piece(bytes)
  var expected = Math.pow(2, 22)
  var pieces = Math.ceil(bytes / expected)
  var log = message(bytes, expected, pieces)

  test.equal(result, expected, log)
  test.end()
})
