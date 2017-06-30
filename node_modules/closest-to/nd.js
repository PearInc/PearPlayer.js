var closest = require('./')

module.exports = ndclosest

function ndclosest (arr, ndarr, rndx) {
  var ndx = closest(sum(arr), sums(ndarr), true)
  return rndx ? ndx : ndarr[ndx]
}

function sums (arr) {
  var sarr = [], i = 0, l = arr.length
  for (; i < l;) sarr[i] = sum(arr[i++])
  return sarr
}

function sum (arr) {
  var n = 0, i = 0, l = arr.length
  for (; i < l;) n += arr[i++]
  return n
}
