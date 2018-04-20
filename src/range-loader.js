/**
 * Created by xieting on 2018/4/2.
 */

var debug = require('debug')('pear:reporter');
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');

module.exports = RangeLoader;
inherits(RangeLoader, EventEmitter);

function RangeLoader(config) {
    EventEmitter.call(this);

    this.initialDownloaders = config.initialDownloaders;
    this.downloaders = [];
    this.callback = {};
    var self = this;
    this.downloaders = this.initialDownloaders.map(function (item){

        self._setupHttp(item);
        return item;
    });


}

RangeLoader.prototype.select = function (start, end, cb) {

    var loader = this.downloaders.shift();

    loader.select(start, end);

    this.downloaders.push(loader);

    this.callback[start+'-'+end] = cb;
};

RangeLoader.prototype._setupHttp = function (hd) {
    var self = this;

    hd.once('error', function (error) {

        self.emit('error');
    });

    hd.on('data',function (buffer, start, end, speed) {

        debug('httpDownloader' + hd.uri +' ondata range:'+start+'-'+end);

        var cb = self.callback[start+'-'+end];

        if (cb) cb(buffer);

    });

    return hd;
};
