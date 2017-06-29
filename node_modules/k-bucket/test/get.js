'use strict'
var bufferEquals = require('buffer-equals')
var test = require('tape')
var KBucket = require('../')

test('throws TypeError if id is not a Buffer', function (t) {
  var kBucket = new KBucket()
  t.throws(function () {
    kBucket.get('foo')
  })
  t.end()
})

test('get retrieves null if no contacts', function (t) {
  var kBucket = new KBucket()
  t.same(kBucket.get(new Buffer('foo')), null)
  t.end()
})

test('get retrieves a contact that was added', function (t) {
  var kBucket = new KBucket()
  var contact = { id: new Buffer('a') }
  kBucket.add(contact)
  t.true(bufferEquals(kBucket.get(new Buffer('a')).id, new Buffer('a')))
  t.end()
})

test('get retrieves most recently added contact if same id', function (t) {
  var kBucket = new KBucket()
  var contact = { id: new Buffer('a'), foo: 'foo', bar: ':p', vectorClock: 0 }
  var contact2 = { id: new Buffer('a'), foo: 'bar', vectorClock: 1 }
  kBucket.add(contact)
  kBucket.add(contact2)
  t.true(bufferEquals(kBucket.get(new Buffer('a')).id, new Buffer('a')))
  t.same(kBucket.get(new Buffer('a')).foo, 'bar')
  t.same(kBucket.get(new Buffer('a')).bar, undefined)
  t.end()
})

test('get retrieves contact from nested leaf node', function (t) {
  var kBucket = new KBucket({localNodeId: new Buffer([ 0x00, 0x00 ])})
  for (var i = 0; i < kBucket.numberOfNodesPerKBucket; ++i) {
    kBucket.add({ id: new Buffer([ 0x80, i ]) }) // make sure all go into "far away" bucket
  }
  // cause a split to happen
  kBucket.add({ id: new Buffer([ 0x00, i ]), find: 'me' })
  t.same(kBucket.get(new Buffer([ 0x00, i ])).find, 'me')
  t.end()
})
