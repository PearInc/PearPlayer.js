var benchmark = require('benchmark')
var v1 = require('closest-to')
var v2 = require('./')

benchmark.Suite()
  .add('1.0.1', function () {
    v1(40, [1204, 12.3, 2, 10, 50, 23, 11, 33, 1e9])
  })
  .add('2.0.0', function () {
    v2(40, [1204, 12.3, 2, 10, 50, 23, 11, 33, 1e9]
      .sort(function (a, b) { return a - b }), true)
  })
  .on('error', error)
  .on('cycle', cycle)
  .run({ async: true })

function error (e) {
  console.error(e.target.error.stack)
}

function cycle (e) {
  console.log(String(e.target))
}
