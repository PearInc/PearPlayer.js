
module.exports = File;

var eos = require('end-of-stream');
var EventEmitter = require('events').EventEmitter;
var path = require('path');
var inherits = require('inherits');
var render = require('render-media');
var stream = require('readable-stream');
var FileStream = require('./file-stream');
var streamToBlobURL = require('stream-to-blob-url')

inherits(File, EventEmitter);

function File (dispatcher, file){
    EventEmitter.call(this);

    this._dispatcher = dispatcher;
    this._destroyed = false;

    this.name = file.name;
    this.path = '/tmp/dispatcher'+this.name;

    this.length = file.length;
    this.offset = file.offset;

    this.done = false;

    var start = file.offset;
    var end = start + file.length - 1;

    this._startPiece = start / this._dispatcher.pieceLength | 0;
    this._endPiece = end / this._dispatcher.pieceLength | 0;
    // console.log('file _startPiece'+this._startPiece+' _endPiece:'+this._endPiece);

    if (this.length === 0) {
        this.done = true;
        this.emit('done');
    }

    this._dispatcher.path = this.path;
    this._dispatcher.elem = file.elem;
    this._dispatcher._init();
};

File.prototype.createReadStream = function (opts) {
    var self = this;
    opts = opts || {};
    console.log('createReadStream');
    console.log(opts.start?opts.start:0);
    if (this.length === 0) {
        var empty = new stream.PassThrough();
        process.nextTick(function () {
            empty.end()
        });
        return empty;
    }

    var fileStream = new FileStream(self, opts);
    self._dispatcher.startFrom(fileStream._startPiece, true, function () {
        fileStream._notify();
    });
    // self._dispatcher._updateAfterSeek();
    // eos(fileStream, function () {
    //     if (self._destroyed) return;
    //     if (!self._dispatcher.destroyed) {
    //         self._dispatcher.deStartFrom(fileStream._startPiece, true);
    //     }
    // });
    fileStream.once('canplay', function () {
        self.emit('canplay');
    });
    return fileStream;
};

File.prototype.renderTo = function (elem, opts, cb) {

    render.render(this, elem, opts, cb);

};

File.prototype.getBlobURL = function (cb) {
    // if (typeof window === 'undefined') throw new Error('browser-only method')
    streamToBlobURL(this.createReadStream(), this._getMimeType(), cb)
};

File.prototype._getMimeType = function () {
    return render.mime[path.extname(this.name).toLowerCase()]
};

File.prototype._destroy = function () {
    this._destroyed = true;
    this._dispatcher = null;
};


