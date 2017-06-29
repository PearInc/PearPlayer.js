/*
Instance of writable stream.

call .get(length) or .discard(length) to get a stream (relative to the last end)

emits 'stalled' once everything is written


*/
var inherits = require('inherits')
var stream = require('readable-stream')

module.exports = RangeSliceStream

inherits(RangeSliceStream, stream.Writable)

function RangeSliceStream (offset, opts) {
	var self = this
	if (!(self instanceof RangeSliceStream)) return new RangeSliceStream(offset)
	stream.Writable.call(self, opts)

	self.destroyed = false
	self._queue = []
	self._position = offset || 0
	self._cb = null
	self._buffer = null
	self._out = null
}

RangeSliceStream.prototype._write = function (chunk, encoding, cb) {
	var self = this

	var drained = true

	while (true) {
		if (self.destroyed) {
			return
		}

		// Wait for more queue entries
		if (self._queue.length === 0) {
			self._buffer = chunk
			self._cb = cb
			return
		}

		self._buffer = null
		var currRange = self._queue[0]
		// Relative to the start of chunk, what data do we need?
		var writeStart = Math.max(currRange.start - self._position, 0)
		var writeEnd = currRange.end - self._position

		// Check if we need to throw it all away
		if (writeStart >= chunk.length) {
			self._position += chunk.length
			return cb(null)
		}

		// Check if we need to use it all
		var toWrite
		if (writeEnd > chunk.length) {
			self._position += chunk.length
			if (writeStart === 0) {
				toWrite = chunk
			} else {
				toWrite = chunk.slice(writeStart)
			}
			drained = currRange.stream.write(toWrite) && drained
			break
		}

		self._position += writeEnd
		if (writeStart === 0 && writeEnd === chunk.length) {
			toWrite = chunk
		} else {
			toWrite = chunk.slice(writeStart, writeEnd)
		}
		drained = currRange.stream.write(toWrite) && drained
		if (currRange.last) {
			currRange.stream.end()
		}
		chunk = chunk.slice(writeEnd)
		self._queue.shift()
	}

	if (drained) {
		cb(null)
	} else {
		currRange.stream.once('drain', cb.bind(null, null))
	}
}

RangeSliceStream.prototype.slice = function (ranges) {
	var self = this

	if (self.destroyed) return null

	if (!(ranges instanceof Array)) {
		ranges = [ranges]
	}

	var str = new stream.PassThrough()

	ranges.forEach(function (range, i) {
		self._queue.push({
			start: range.start,
			end: range.end,
			stream: str,
			last: i === (ranges.length - 1)
		})
	})
	if (self._buffer) {
		self._write(self._buffer, null, self._cb)
	}

	return str
}

RangeSliceStream.prototype.destroy = function (err) {
	var self = this
	if (self.destroyed) return
	self.destroyed = true

	if (err) self.emit('error', err)
}
