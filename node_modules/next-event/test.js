var tape = require('tape')
var once = require('./')
var EventEmitter = require('events').EventEmitter

tape('once', function (t) {
  t.plan(1)

  var e = new EventEmitter()
  var ontest = once(e, 'test')

  ontest(function () {
    t.ok(true, 'once')
  })

  e.emit('test')
  e.emit('test')
})

tape('once twice', function (t) {
  t.plan(2)

  var e = new EventEmitter()
  var ontest = once(e, 'test')

  ontest(function () {
    t.ok(true, 'once')
  })

  e.emit('test')

  ontest(function () {
    t.ok(true, 'once again')
  })

  e.emit('test')
})

tape('last one wins', function (t) {
  t.plan(1)

  var e = new EventEmitter()
  var ontest = once(e, 'test')

  ontest(function () {
    t.ok(false, 'oh no')
  })
  ontest(function () {
    t.ok(true, 'once')
  })

  e.emit('test')
})

tape('recursive emit', function (t) {
  t.plan(1)

  var e = new EventEmitter()
  var ontest = once(e, 'test')

  ontest(function () {
    t.ok(true, 'once')
    e.emit('test')
  })

  e.emit('test')
})
