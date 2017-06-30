module.exports = MultiStream

var inherits = require('inherits')
var stream = require('readable-stream')

inherits(MultiStream, stream.Readable)

function MultiStream (streams, opts) {
  var self = this
  if (!(self instanceof MultiStream)) return new MultiStream(streams, opts)
  stream.Readable.call(self, opts)

  self.destroyed = false

  self._drained = false
  self._forwarding = false
  self._current = null

  if (typeof streams === 'function') {
    self._queue = streams
  } else {
    self._queue = streams.map(toStreams2)
    self._queue.forEach(function (stream) {
      if (typeof stream !== 'function') self._attachErrorListener(stream)
    })
  }

  self._next()
}

MultiStream.obj = function (streams) {
  return new MultiStream(streams, { objectMode: true, highWaterMark: 16 })
}

MultiStream.prototype._read = function () {
  this._drained = true
  this._forward()
}

MultiStream.prototype._forward = function () {
  if (this._forwarding || !this._drained || !this._current) return
  this._forwarding = true

  var chunk
  while ((chunk = this._current.read()) !== null) {
    this._drained = this.push(chunk)
  }

  this._forwarding = false
}

MultiStream.prototype.destroy = function (err) {
  if (this.destroyed) return
  this.destroyed = true

  if (this._current && this._current.destroy) this._current.destroy()
  if (typeof this._queue !== 'function') {
    this._queue.forEach(function (stream) {
      if (stream.destroy) stream.destroy()
    })
  }

  if (err) this.emit('error', err)
  this.emit('close')
}

MultiStream.prototype._next = function () {
  var self = this
  self._current = null

  if (typeof self._queue === 'function') {
    self._queue(function (err, stream) {
      if (err) return self.destroy(err)
      stream = toStreams2(stream)
      self._attachErrorListener(stream)
      self._gotNextStream(stream)
    })
  } else {
    var stream = self._queue.shift()
    if (typeof stream === 'function') {
      stream = toStreams2(stream())
      self._attachErrorListener(stream)
    }
    self._gotNextStream(stream)
  }
}

MultiStream.prototype._gotNextStream = function (stream) {
  var self = this

  if (!stream) {
    self.push(null)
    self.destroy()
    return
  }

  self._current = stream
  self._forward()

  stream.on('readable', onReadable)
  stream.once('end', onEnd)
  stream.once('close', onClose)

  function onReadable () {
    self._forward()
  }

  function onClose () {
    if (!stream._readableState.ended) {
      self.destroy()
    }
  }

  function onEnd () {
    self._current = null
    stream.removeListener('readable', onReadable)
    stream.removeListener('end', onEnd)
    stream.removeListener('close', onClose)
    self._next()
  }
}

MultiStream.prototype._attachErrorListener = function (stream) {
  var self = this
  if (!stream) return

  stream.once('error', onError)

  function onError (err) {
    stream.removeListener('error', onError)
    self.destroy(err)
  }
}

function toStreams2 (s) {
  if (!s || typeof s === 'function' || s._readableState) return s

  var wrap = new stream.Readable().wrap(s)
  if (s.destroy) {
    wrap.destroy = s.destroy.bind(s)
  }
  return wrap
}
