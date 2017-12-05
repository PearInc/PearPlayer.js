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

// class  PearDownloaderTag extends HTMLElement {
//     constructor() {
//         super();
//         this.progress = 0;
//         this.status = 'ready';
//         this.speed = 0;
//         this.fileName = 'unknown';
//         this.p2pRatio = 0;
//         this.autoDownload = false;
//
//         this.addEventListener('click', e => {
//             if (this.disabled) {
//             return;
//         }
//         this.downloader = this.createDownloader();
//         this.downloaderLifeCycle();
//     });
//     }
//
//     connectedCallback() {
//         // this.textContent = "卧槽！！！ - ";
//     }
//
//     createDownloader() {
//
//         if (!this.dataset.src) {
//             console.error('Must set data-src attribuite!');
//             return false;
//         }
//         let token = '';
//         if (this.dataset.token) {
//             token = this.dataset.token;
//         }
//
//         let downloader = new PearDownloader(this.dataset.src, token, {
//             useMonitor: true,             //是否开启monitor,会稍微影响性能,默认false
//         });
//
//
//         if (this.dataset.autoDownload == 'true') {
//             this.autoDownload = true;
//         }
//
//         return downloader;
//     }
//
//     downloaderLifeCycle() {
//         this.downloader.on('begin', () => {
//             this.status = 'ready';
//             this.fileName = this.downloader.fileName;
//
//             let ev = new CustomEvent("progress");
//             this.dispatchEvent(ev);
//         });
//
//         this.downloader.on("progress", (prog) => {
//
//             this.progress = prog;
//             this.status = prog < 1.0 ? 'downloading' : 'done';
//
//             let ev = new CustomEvent("progress");
//             this.dispatchEvent(ev);
//         });
//
//         this.downloader.on('meanspeed', (speed) => {
//             this.speed = speed;
//         });
//
//         this.downloader.on('done', () => {
//             if (this.autoDownload) {
//                 let aTag = document.createElement('a');
//                 aTag.download = this.fileName;
//                 this.downloader.file.getBlobURL(function (error, url) {
//                     aTag.href = url;
//                     aTag.click();
//                 })
//             }
//
//
//         });
//         this.downloader.on('fogratio', (p2pRatio) => {
//
//             this.p2pRatio = p2pRatio;
//         });
//
//     }
// }
//
// window.customElements.define('pear-downloader', PearDownloaderTag);

