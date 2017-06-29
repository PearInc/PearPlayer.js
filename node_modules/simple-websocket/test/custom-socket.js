/* global WebSocket */

var Socket = require('../')
var test = require('tape')
var ws = require('ws') // websockets in node - will be empty object in browser

var SOCKET_SERVER = 'wss://echo.websocket.org'

var _WebSocket = typeof ws !== 'function' ? WebSocket : ws

test('echo string (with custom socket)', function (t) {
  t.plan(4)

  var ws = new _WebSocket(SOCKET_SERVER)
  var socket = new Socket({
    socket: ws
  })
  socket.on('connect', function () {
    t.pass('connect emitted')
    socket.send('sup!')
    socket.on('data', function (data) {
      t.ok(Buffer.isBuffer(data), 'data is Buffer')
      t.equal(data.toString(), 'sup!')

      socket.destroy(function () {
        t.pass('destroyed socket')
      })
    })
  })
})

test('echo Buffer (with custom socket)', function (t) {
  t.plan(4)

  var ws = new _WebSocket(SOCKET_SERVER)
  var socket = new Socket({
    socket: ws
  })
  socket.on('connect', function () {
    t.pass('connect emitted')
    socket.send(Buffer.from([1, 2, 3]))
    socket.on('data', function (data) {
      t.ok(Buffer.isBuffer(data), 'data is Buffer')
      t.deepEqual(data, Buffer.from([1, 2, 3]), 'got correct data')

      socket.destroy(function () {
        t.pass('destroyed socket')
      })
    })
  })
})

test('echo Uint8Array (with custom socket)', function (t) {
  t.plan(4)

  var ws = new _WebSocket(SOCKET_SERVER)
  var socket = new Socket({
    socket: ws
  })
  socket.on('connect', function () {
    t.pass('connect emitted')
    socket.send(new Uint8Array([1, 2, 3]))
    socket.on('data', function (data) {
      // binary types always get converted to Buffer
      // See: https://github.com/feross/simple-peer/issues/138#issuecomment-278240571
      t.ok(Buffer.isBuffer(data), 'data is Buffer')
      t.deepEqual(data, Buffer.from([1, 2, 3]), 'got correct data')

      socket.destroy(function () {
        t.pass('destroyed socket')
      })
    })
  })
})

test('echo ArrayBuffer (with custom socket)', function (t) {
  t.plan(4)

  var ws = new _WebSocket(SOCKET_SERVER)
  var socket = new Socket({
    socket: ws
  })
  socket.on('connect', function () {
    t.pass('connect emitted')
    socket.send(new Uint8Array([1, 2, 3]).buffer)
    socket.on('data', function (data) {
      t.ok(Buffer.isBuffer(data), 'data is Buffer')
      t.deepEqual(data, Buffer.from([1, 2, 3]), 'got correct data')

      socket.destroy(function () {
        t.pass('destroyed socket')
      })
    })
  })
})
