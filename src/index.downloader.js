/**
 * Created by XieTing on 17-6-6.
 */

module.exports = PearDownloader;

var inherits = require('inherits');
var Worker = require('./worker');

inherits(PearDownloader, Worker);

function PearDownloader(urlStr, token, opts) {
    var self = this;
    if (!(self instanceof PearDownloader)) return new PearDownloader(urlStr, token, opts);
    // if (!(self instanceof PearPlayer)) return new PearPlayer(selector, opts);
    if (typeof token === 'object') return PearDownloader(urlStr, '', token);
    Worker.call(self, urlStr, token, opts);
}
