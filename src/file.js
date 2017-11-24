
module.exports = File;

var debug = require('debug')('pear:file');
var eos = require('end-of-stream');
var EventEmitter = require('events').EventEmitter;
var path = require('path');
var inherits = require('inherits');
var mime = require('render-media/lib/mime.json')
var stream = require('readable-stream');
var FileStream = require('./file-stream');
var streamToBlobURL = require('stream-to-blob-url');
var streamToBuffer = require('stream-with-known-length-to-buffer');
// var WebTorrent = require('./pear-torrent');

inherits(File, EventEmitter);

function File (dispatcher, file){
    EventEmitter.call(this);

    this._dispatcher = dispatcher;
    // this.seeder = null;
    this._destroyed = false;

    this.name = file.name;
    this.path = '/tmp/player'+this.name;

    this.length = file.length;
    this.offset = file.offset;

    this.done = false;

    var start = file.offset;
    var end = start + file.length - 1;

    this._startPiece = start / this._dispatcher.pieceLength | 0;
    this._endPiece = end / this._dispatcher.pieceLength | 0;
    // debug('file _startPiece'+this._startPiece+' _endPiece:'+this._endPiece);

    if (this.length === 0) {
        this.done = true;
        this.emit('done');
    }

    this._dispatcher.path = this.path;
    this._dispatcher.elem = file.elem;
    // this._dispatcher._init();

};

File.prototype.createReadStream = function (opts) {
    var self = this;
    // opts = opts || {};
    // debug('createReadStream');
    // debug(opts.start?opts.start:0);

    // if (!opts) return;

    if (this.length === 0) {
        var empty = new stream.PassThrough();
        process.nextTick(function () {
            empty.end()
        });
        return empty;
    }

    var fileStream = new FileStream(self, opts);
    self._dispatcher.select(fileStream._startPiece, fileStream._endPiece, true, function () {
        fileStream._notify()
    });
    // self._dispatcher.startFrom(fileStream._startPiece, true, function () {
    //     fileStream._notify();
    // });
    // self._dispatcher._updateAfterSeek();
    eos(fileStream, function () {
        if (self._destroyed) return;
        if (!self._dispatcher.destroyed) {
            self._dispatcher.deselect(fileStream._startPiece, fileStream._endPiece, true);
            // self._dispatcher.deStartFrom(fileStream._startPiece, true);
        }
    });
    return fileStream;
};

// File.prototype.renderTo = function (elem, opts, cb) {
//
//     render.render(this, elem, opts, cb);
//
// };

File.prototype.getBuffer = function (cb) {
    streamToBuffer(this.createReadStream(), this.length, cb)
};

File.prototype.getBlobURL = function (cb) {
    // if (typeof window === 'undefined') throw new Error('browser-only method')
    streamToBlobURL(this.createReadStream(), this._getMimeType(), cb)
};

File.prototype.getProgressiveBlobURL = function (cb) {
    // if (typeof window === 'undefined') throw new Error('browser-only method')
    streamToBlobURL(this.createReadStream({start: 0, end: this._dispatcher.downloaded}), this._getMimeType(), cb)
};

File.prototype._getMimeType = function () {
    return mime[path.extname(this.name).toLowerCase()]
};

File.prototype._destroy = function () {
    this._destroyed = true;
    this._dispatcher = null;
};


