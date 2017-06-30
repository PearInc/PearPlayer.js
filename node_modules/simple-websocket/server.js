module.exports = SocketServer

var events = require('events')
var inherits = require('inherits')
var Socket = require('./')
var WebSocketServer = require('ws').Server

inherits(SocketServer, events.EventEmitter)

function SocketServer (opts) {
  var self = this
  if (!(self instanceof SocketServer)) return new SocketServer(opts)

  opts = Object.assign({
    clientTracking: false,
    perMessageDeflate: false
  }, opts)

  events.EventEmitter.call(self)

  self._server = new WebSocketServer(opts)

  self._onConnectionBound = function (conn) {
    self._onConnection(conn)
  }
  self._server.on('connection', self._onConnectionBound)

  self._onErrorBound = function (err) {
    self._onError(err)
  }
  self._server.once('error', self._onErrorBound)
}

SocketServer.prototype.close = function (cb) {
  this._server.removeListener('connection', this._onConnectionBound)
  this._server.removeListener('error', this._onErrorBound)
  this._server.close(cb)
  this.emit('close')
}

SocketServer.prototype._onConnection = function (conn) {
  var socket = new Socket({ socket: conn })
  socket._onOpen()
  socket.upgradeReq = conn.upgradeReq
  this.emit('connection', socket)
  this.once('close', function () {
    socket.upgradeReq = null
  })
}

SocketServer.prototype._onError = function (err) {
  this.emit('error', err)
  this.close()
}
