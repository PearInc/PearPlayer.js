var parallelLimit = require('../')
var test = require('tape')

test('empty tasks array', function (t) {
  t.plan(1)

  parallelLimit([], 1, function (err) {
    t.error(err)
  })
})

test('empty tasks object', function (t) {
  t.plan(1)

  parallelLimit({}, 10, function (err) {
    t.error(err)
  })
})

test('empty tasks array and no callback', function (t) {
  parallelLimit([], 2)
  t.pass('did not throw')
  t.end()
})

test('empty tasks object and no callback', function (t) {
  parallelLimit({}, 20)
  t.pass('did not throw')
  t.end()
})
