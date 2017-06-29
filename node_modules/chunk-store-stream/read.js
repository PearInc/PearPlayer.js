module.exports = ChunkStoreReadStream

var inherits = require('inherits')
var stream = require('readable-stream')

inherits(ChunkStoreReadStream, stream.Readable)

function ChunkStoreReadStream (store, chunkLength, opts) {
  if (!(this instanceof ChunkStoreReadStream)) {
    return new ChunkStoreReadStream(store, chunkLength, opts)
  }
  stream.Readable.call(this, opts)
  if (!opts) opts = {}

  if (!store || !store.put || !store.get) {
    throw new Error('First argument must be an abstract-chunk-store compliant store')
  }
  chunkLength = Number(chunkLength)
  if (!chunkLength) throw new Error('Second argument must be a chunk length')

  this._length = opts.length || store.length
  if (!Number.isFinite(this._length)) throw new Error('missing required `length` property')

  this._store = store
  this._chunkLength = chunkLength
  this._index = 0
}

ChunkStoreReadStream.prototype._read = function () {
  var self = this
  if (self._index * self._chunkLength >= self._length) {
    self.push(null)
  } else {
    self._store.get(self._index, function (err, chunk) {
      if (err) return self.destroy(err)
      self.push(chunk)
    })
  }
  self._index += 1
}

ChunkStoreReadStream.prototype.destroy = function (err) {
  if (this.destroyed) return
  this.destroyed = true

  if (err) this.emit('error', err)
  this.emit('close')
}
