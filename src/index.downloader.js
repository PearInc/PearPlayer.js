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

var PRDownloaderProto = Object.create(HTMLElement.prototype);
PRDownloaderProto.createdCallback = function() {
    console.warn('PRDownloaderProto created');

    var downloader = new PearDownloader(this.dataset.src, {
        scheduler: this.dataset.scheduler,
        auto: this.dataset.auto,
        interval: this.dataset.interval,
        useDataChannel: this.dataset.useDataChannel,
        dataChannels: this.dataset.dataChannels,
        useTorrent: this.dataset.useTorrent,
        magnetURI: this.dataset.magnetURI,
        // trackers:["wss://tracker.openwebtorrent.com"],
        // sources: [],
        useMonitor: this.dataset.useMonitor,
    });
    PRDownloaderProto.downloader = downloader;

}
// PRDownloaderProto.attachedCallback = function() {
//     console.warn('XTreehouseProto attached:'+this.dataset.useMonitor);
//     console.log(this.dataset.src)
//
//     // downloader.call(this);
// }
PRDownloaderProto.detachedCallback = function() {

}
PRDownloaderProto.attributeChangedCallback = function(attrName, oldValue, newValue) {}
var PRDownloader = document.registerElement('pr-downloader', { prototype: PRDownloaderProto });
// PRDownloader.call(PearDownloader);