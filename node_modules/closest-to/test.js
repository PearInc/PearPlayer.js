var test = require('tape')
var closest = require('./')
var ndclosest = require('./nd')

test('it works', function (assert) {
  var array = [2, 10, 11, 12.3, 23, 33, 50, 1204, 1e9]
  assert.equal(closest(40, array), 33)
  assert.equal(closest(40, array, true), 5)
  assert.end()
})

test('it works with negatives and floats', function (assert) {
  var array = [-1.5, -0.75, 0, 2]
  assert.equal(closest(-1.25, array), -1.5)
  assert.equal(closest(-1.25, array, true), 0)
  assert.end()
})

test('it returns the first closest number', function (assert) {
  var array = [30, 50]
  assert.equal(closest(40, array), 30)
  assert.equal(closest(40, array, true), 0)
  assert.end()
})

test('it works with multidimensional arrays', function (assert) {
  var ndarray = [[1, 1], [2, 3], [3, 4]]
  assert.deepEqual(ndclosest([1, 2], ndarray), [1, 1])
  assert.equal(ndclosest([1, 2], ndarray, true), 0)
  assert.end()
})

test('it handles arrays with duplicate values', function (test) {
  var array = [0, 1, 4, 7, 7, 7, 10]
  test.equal(closest(9, array), 10)
  test.equal(closest(9, array, true), 6)
  test.end()
})
