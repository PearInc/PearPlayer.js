module.exports = FileStream;

var inherits = require('inherits');
var stream = require('readable-stream');

inherits(FileStream, stream.Readable);

/**
 * Readable stream of a torrent file
 *
 * @param {File} file
 * @param {Object} opts
 * @param {number} opts.start stream slice of file, starting from this byte (inclusive)
 * @param {number} opts.end stream slice of file, ending with this byte (inclusive)
 */
function FileStream (file, opts) {
    stream.Readable.call(this, opts);

    this.destroyed = false;
    this._dispatcher = file._dispatcher;

    var start = (opts && opts.start) || 0;
    var end = (opts && opts.end && opts.end < file.length)
        ? opts.end
        : file.length - 1;

    var pieceLength = file._dispatcher.pieceLength;
    this._startPiece = (start + file.offset) / pieceLength | 0;                 //start和end的单位应该是byte
    this._endPiece = (end + file.offset) / pieceLength | 0;

    this._piece = this._startPiece;
    this._offset = (start + file.offset) - (this._startPiece * pieceLength);

    this._missing = end - start + 1;
    this._reading = false;
    this._notifying = false;
    this._criticalLength = Math.min((1024 * 1024 / pieceLength) | 0, 2);

    // console.log('FileStream _startPiece:'+this._startPiece);
    // console.log('FileStream _endPiece:'+this._endPiece);
    // console.log('FileStream _offset:'+this._offset);
    // console.log('FileStream _missing:'+this._missing);
}

FileStream.prototype._read = function () {
    if (this._reading) return;
    this._reading = true;
    this._notify();
};

FileStream.prototype._notify = function () {
    var self = this;

    if (!self._reading || self._missing === 0) return;
    if (!self._dispatcher.bitfield.get(self._piece)) {
        // return self._dispatcher.critical(self._piece, self._piece + self._criticalLength)
        return noop();
    }

    if (self._notifying) return;

    // self._ifCanPlay();
    // if (!this._dispatcher.enoughInitBuffer) return;
    self._notifying = true;

    var p = self._piece;
    console.log('FileStream get piece:' + p);
    self._dispatcher.store.get(p, function (err, buffer) {
        self._notifying = false;
        if (self.destroyed) return;
        if (err) return self._destroy(err);
        // debug('read %s (length %s) (err %s)', p, buffer.length, err && err.message)
        // console.log('read '+p+' length:'+buffer.length);
        if (self._offset) {
            buffer = buffer.slice(self._offset);
            self._offset = 0;
        }

        if (self._missing < buffer.length) {
            buffer = buffer.slice(0, self._missing);
        }
        self._missing -= buffer.length;

        // console.log('pushing buffer of length:'+buffer.length);
        self._reading = false;
        self.push(buffer);
        // if (p === self._dispatcher._windowLength/2) {
        //     self.emit('canplay');
        // }
        if (self._missing === 0) self.push(null);
    });
    self._piece += 1;
};

FileStream.prototype.destroy = function (onclose) {
    this._destroy(null, onclose)
};

FileStream.prototype._destroy = function (err, onclose) {
    if (this.destroyed) return;
    this.destroyed = true;

    if (!this._dispatcher.destroyed) {
        this._dispatcher.deselect(this._startPiece, this._endPiece, true);
    }
    console.log('FileStream destroy');
    if (err) this.emit('error', err);
    this.emit('close');
    if (onclose) onclose();
};

// FileStream.prototype._ifCanPlay = function () {                   //缓存足够的buffer后才播放
//     if (this._dispatcher.enoughInitBuffer) return;
//     var bitfield = this._dispatcher.bitfield;
//     console.log('this._dispatcher.normalWindowLength:'+this._dispatcher.normalWindowLength);
//     for (var i=this._startPiece;i<this._startPiece+this._dispatcher.normalWindowLength;i++) {
//         if (!bitfield.get(i)) {
//             return;
//         }
//     }
//     // if (this._dispatcher.autoplay) {
//     //     this._dispatcher.video.play();
//     // }
//     this._dispatcher.enoughInitBuffer = true;
// };

function noop () {}