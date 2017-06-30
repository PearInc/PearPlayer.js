'use strict'
var test = require('tape')
var KBucket = require('../')

test('count returns 0 when no contacts in bucket', function (t) {
  var kBucket = new KBucket()
  t.same(kBucket.count(), 0)
  t.end()
})

test('count returns 1 when 1 contact in bucket', function (t) {
  var kBucket = new KBucket()
  var contact = { id: new Buffer('a') }
  kBucket.add(contact)
  t.same(kBucket.count(), 1)
  t.end()
})

test('count returns 1 when same contact added to bucket twice', function (t) {
  var kBucket = new KBucket()
  var contact = { id: new Buffer('a') }
  kBucket.add(contact)
  kBucket.add(contact)
  t.same(kBucket.count(), 1)
  t.end()
})

test('count returns number of added unique contacts', function (t) {
  var kBucket = new KBucket()
  kBucket.add({ id: new Buffer('a') })
  kBucket.add({ id: new Buffer('a') })
  kBucket.add({ id: new Buffer('b') })
  kBucket.add({ id: new Buffer('b') })
  kBucket.add({ id: new Buffer('c') })
  kBucket.add({ id: new Buffer('d') })
  kBucket.add({ id: new Buffer('c') })
  kBucket.add({ id: new Buffer('d') })
  kBucket.add({ id: new Buffer('e') })
  kBucket.add({ id: new Buffer('f') })
  t.same(kBucket.count(), 6)
  t.end()
})
