var zeroFill = require('../')
var test = require('tape')

test('basic use', function (t) {
  t.equal(zeroFill(4, 1), '0001')
  t.equal(zeroFill(10, 1), '0000000001')
  t.equal(zeroFill(10, 55), '0000000055')
  t.equal(zeroFill(1, 1), '1')
  t.end()
})

test('width edge cases', function (t) {
  t.equal(zeroFill(1, 20), '20', 'do not trim string if width is too small')
  t.equal(zeroFill(0, 20), '20', 'zero width')
  t.equal(zeroFill(0, 1), '1', 'zero width')
  t.end()
})

test('partial application', function (t) {
  t.equal(zeroFill(4)(1), '0001')
  t.equal(zeroFill(10)(1), '0000000001')
  t.equal(zeroFill(10)(55), '0000000055')
  t.equal(zeroFill(1)(1), '1')
  t.equal(zeroFill(3)(1, ' '), '  1') // custom pad character
  t.end()
})

test('custom pad character', function (t) {
  t.equal(zeroFill(4, 1, ' '), '   1')
  t.equal(zeroFill(10, 1, 'x'), 'xxxxxxxxx1')
  t.equal(zeroFill(10, 55, 'x'), 'xxxxxxxx55')
  t.equal(zeroFill(1, 1, 'x'), '1')
  t.end()
})
