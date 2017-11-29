/**
 * Created by xieting on 2017/11/8.
 */

module.exports = PearPlayer;

var debug = require('debug')('pear:player');
var inherits = require('inherits');
var render = require('render-media');
var PearDownloader = require('./src/index.downloader');
var WebTorrent = require('webtorrent');

inherits(PearPlayer, PearDownloader);

function PearPlayer(selector, token, opts) {

    var self = this;
    if (!(self instanceof PearPlayer)) return new PearPlayer(selector, token, opts);
    if (typeof token === 'object') return PearPlayer(selector, '', token);

    if (typeof selector !== 'string') throw new Error('video selector must be a string!');
    self.video = document.querySelector(selector);
    opts.selector = selector;
    opts.render = render;
    opts.interval = 3000;

    //monitor
    self.canPlayDelayStart = (new Date()).getTime();

    if (opts.BTMode && opts.magnetURI) {

        var client = new WebTorrent();

        return client.add(opts.magnetURI, function (torrent) {
            // Got torrent metadata!
            // debug('Client is downloading:', torrent.infoHash)

            torrent.files.forEach(function (file) {

                render.render(file, opts.selector, {autoplay: opts.autoplay});
            })
        })

    }

    PearDownloader.call(self, opts.src || self.video.src, token, opts);

    self.setupListeners();
}

PearPlayer.prototype.setupListeners = function () {
    var self = this;

    self.video.addEventListener('canplay', function () {

        self.canPlayDelayEnd = (new Date()).getTime();
        var canPlayDelay = (self.canPlayDelayEnd - self.canPlayDelayStart);
        self.emit('canplay', canPlayDelay);
    });

    self.video.addEventListener('loadedmetadata', function () {

        var dispatcher = self.dispatcher;

        var bitrate = Math.ceil(dispatcher.fileSize/self.video.duration);
        var windowLength = Math.ceil(bitrate * 15 / dispatcher.pieceLength);       //根据码率和时间间隔来计算窗口长度
        // console.warn('dispatcher._windowLength:'+dispatcher._windowLength);
        // self.normalWindowLength = self._windowLength;
        if (windowLength < 3) {
            windowLength = 3;
        } else if (self._windowLength > 15) {
            windowLength = 15;
        }
        dispatcher._windowLength = windowLength;
        dispatcher.interval = 5000;
        // console.warn('dispatcher._windowLength:'+dispatcher._windowLength);
        // self._colddown = 5/self._slideInterval*self._interval2BufPos + 5;                        //窗口滑动的冷却时间
        // self._colddown = self._windowLength*2;
        // self._colddown = 5;
        self.emit('metadata', {'bitrate': bitrate, 'duration': self.video.duration});

        // if (self.useTorrent && self.magnetURI) {
        //     var client = new WebTorrent();
        //     // client.on('error', function () {
        //     //
        //     // });
        //     debug('magnetURI:'+self.magnetURI);
        //     client.add(self.magnetURI, {
        //             announce: self.trackers || [
        //                 "wss://tracker.openwebtorrent.com",
        //                 "wss://tracker.btorrent.xyz"
        //             ],
        //             store: d.store,
        //             bitfield: d.bitfield
        //         },
        //         function (torrent) {
        //             debug('Torrent:', torrent);
        //
        //             d.addTorrent(torrent);
        //         }
        //     );
        // }

    });

}

PearPlayer.isWebRTCSupported = function () {
    return PearDownloader.isWebRTCSupported();
};

PearPlayer.isMSESupported = function () {
    return isMSESupported();
};

function isMSESupported() {

    return !!(window['MediaSource'] || window['WebKitMediaSource']);

}