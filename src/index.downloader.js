/**
 * Created by XieTing on 17-6-6.
 */

module.exports = PearDownloader;

var debug = require('debug');
var inherits = require('inherits');
var Worker = require('./worker');
var version = require('../package.json').version;

inherits(PearDownloader, Worker);

function PearDownloader(urlStr, token, opts) {
    var self = this;
    if (!(self instanceof PearDownloader)) return new PearDownloader(urlStr, token, opts);
    // if (!(self instanceof PearPlayer)) return new PearPlayer(selector, opts);
    if (typeof token === 'object') return PearDownloader(urlStr, '', token);
    if (!opts) opts = {};
    if (opts.debug) {
        debug.enable('pear:*');
    } else {
        debug.disable();
    }
    self.version = version;
    console.info('pear version:'+version);

    Worker.call(self, urlStr, token, opts);
}

PearDownloader.isWebRTCSupported = function () {

    return Worker.isRTCSupported();
};


