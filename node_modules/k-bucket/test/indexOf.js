'use strict'
var test = require('tape')
var KBucket = require('../')

test('indexOf returns a contact with id that contains the same byte sequence as the test contact', function (t) {
  var kBucket = new KBucket()
  kBucket.add({ id: new Buffer('a') })
  t.same(kBucket._indexOf(kBucket.root, new Buffer('a')), 0)
  t.end()
})

test('indexOf returns -1 if contact is not found', function (t) {
  var kBucket = new KBucket()
  kBucket.add({ id: new Buffer('a') })
  t.same(kBucket._indexOf(kBucket.root, new Buffer('b')), -1)
  t.end()
})
