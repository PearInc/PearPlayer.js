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

    //validate
    if (opts.algorithm && ['push', 'pull'].indexOf(opts.algorithm) == -1) throw new Error('Algorithm ' + opts.algorithm + ' is not supported');


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

// PearDownloader.prototype.request = function (start, end, cb) {
//     // console.warn('66666666:'+this.dispatcher.downloaders.length)
//     this.dispatcher.downloaders[0].select(0,12345);
// }


