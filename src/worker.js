/**
 * Created by xieting on 2017/11/9.
 */

module.exports = Worker;

var debug = require('debug')('pear:worker');
var md5 = require('blueimp-md5');
var Dispatcher = require('./dispatcher');
var HttpDownloader = require('./http-downloader');
var RTCDownloader = require('./webrtc-downloader-bin');
var getPeerId = require('./peerid-generator');
var url = require('url');
var File = require('./file');
var nodeFilter = require('./node-filter');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var Set = require('./set');
var WebTorrent = require('./pear-torrent');
var Scheduler = require('./node-scheduler');

// var WEBSOCKET_ADDR = 'ws://signal.webrtc.win:9600/ws';             //test
var WEBSOCKET_ADDR = 'wss://signal.webrtc.win:7601/wss';
var GETNODES_ADDR = 'https://api.webrtc.win:6601/v1/customer/nodes';
var BLOCK_LENGTH = 32 * 1024;

inherits(Worker, EventEmitter);

function Worker(urlStr, token, opts) {
    var self = this;

    // if (!(self instanceof PearPlayer)) return new PearPlayer(selector, opts);
    if (typeof token === 'object') return Worker(urlStr, '', token);
    EventEmitter.call(self);
    opts = opts || {};
    // token = '';
    // if (typeof token !== 'string') throw new Error('token must be a string!');
    // if (!(opts.type && opts.type === 'mp4')) throw new Error('only mp4 is supported!');
    // if (!((opts.src && typeof opts.src === 'string') || self.video.src)) throw new Error('video src is not valid!');
    // if (!(config.token && typeof config.token === 'string')) throw new Error('token is not valid!');

    //player
    self.render = opts.render;
    self.selector = opts.selector;
    self.autoplay = opts.autoplay === false ? false : true;

    self.src = urlStr;
    self.urlObj = url.parse(self.src);
    self.scheduler = opts.scheduler || 'IdleFirst';
    self.token = token;
    self.useDataChannel = (opts.useDataChannel === false)? false : true;
    self.useMonitor = (opts.useMonitor === true)? true : false;
    self.useTorrent = (opts.useTorrent === false)? false : true;
    self.magnetURI = opts.magnetURI || undefined;
    self.trackers = opts.trackers && Array.isArray(opts.trackers) && opts.trackers.length > 0 ? opts.trackers : null;
    self.sources = opts.sources && Array.isArray(opts.sources) && opts.sources.length > 0 ? opts.sources : null;
    self.auto = (opts.auto === false) ? false : true;
    self.dataChannels = opts.dataChannels || 20;
    self.peerId = getPeerId();
    self.isPlaying = false;
    self.fileLength = 0;
    self.nodes = [];
    self.websocket = null;
    self.dispatcher = null;
    self.JDMap = {};                           //根据dc的peer_id来获取jd的map
    self.nodeSet = new Set();                  //保存node的set
    self.tempDCQueue = [];                     //暂时保存data channel的队列
    self.fileName = self.urlObj.path.split('/').pop();
    self.file = null;
    self.dispatcherConfig = {

        chunkSize: opts.chunkSize && (opts.chunkSize%BLOCK_LENGTH === 0 ? opts.chunkSize : Math.ceil(opts.chunkSize/BLOCK_LENGTH)*BLOCK_LENGTH),   //每个chunk的大小,默认1M
        interval: opts.interval,                                 //滑动窗口的时间间隔,单位毫秒,默认10s,
        auto: self.auto,
        useMonitor: self.useMonitor,
        scheduler: Scheduler[self.scheduler]
    };

    if (self.useDataChannel) {
        self._pearSignalHandshake();
    }
    //candidate
    self.candidateMap = {};

    //info
    self.connectedDC = 0;
    self.usefulDC = 0;

    self._debugInfo = {
        totalDCs: 0,
        connectedDCs: 0,
        usefulDCs: 0,
        totalHTTP: 0,
        totalHTTPS: 0,
        usefulHTTPAndHTTPS: 0,
        windowOffset: 0,
        windowLength: 0,
        signalServerConnected: false
    };

    self._start();

}

Object.defineProperty(Worker.prototype, 'debugInfo', {
    get: function () { return this._debugInfo }
});

Worker.prototype._start = function () {
    var self = this;
    if (!getBrowserRTC()) {
        self.emit('exception', {errCode: 1, errMsg: 'This browser do not support WebRTC communication'});
        alert('This browser do not support WebRTC communication');
        self.useDataChannel = false;
    }
    if (!window.WebSocket) {
        self.useDataChannel = false;
    }

    if (self.sources) {                     //如果用户指定下载源

        self.sources = self.sources.map(function (source) {

            return {uri: source, type: 'server'};
        });
        nodeFilter(self.sources, function (nodes, fileLength) {            //筛选出可用的节点,以及回调文件大小

            var length = nodes.length;
            debug('nodes:'+JSON.stringify(nodes));

            if (length) {
                // self.fileLength = fileLength;
                debug('nodeFilter fileLength:'+fileLength);

                self._startPlaying(nodes);
            } else {

                self._fallBack();
            }
        }, {start: 0, end: 30});
    } else {

        self._getNodes(self.token, function (nodes) {
            debug('debug _getNodes: %j', nodes);
            if (nodes) {
                self._startPlaying(nodes);
                // if (self.useDataChannel) {
                //     self._pearSignalHandshake();
                // }
            } else {
                self._fallBack();
            }
        });
    }
};

Worker.prototype._fallBack = function () {

    debug('PearDownloader _fallBack');
}

Worker.prototype._getNodes = function (token, cb) {
    var self = this;

    var postData = {
        client_ip:'116.77.208.118',
        host: self.urlObj.host,
        uri: self.urlObj.path
    };
    postData = (function(obj){
        var str = "?";

        for(var prop in obj){
            str += prop + "=" + obj[prop] + "&"
        }
        return str;
    })(postData);

    var xhr = new XMLHttpRequest();
    xhr.open("GET", GETNODES_ADDR+postData);
    xhr.timeout = 2000;
    xhr.setRequestHeader('X-Pear-Token', self.token);
    xhr.ontimeout = function() {
        // self._fallBack();
        cb(null);
    };
    xhr.onerror = function () {
        self._fallBack();
    };
    xhr.onload = function () {
        if (this.status >= 200 && this.status < 300 || this.status == 304) {

            debug(this.response);

            var res = JSON.parse(this.response);
            // debug(res.nodes);
            if (res.size) {                         //如果filesize大于0
                // self.fileLength = res.size;           //test

                // if (self.useDataChannel) {
                //     self._pearSignalHandshake();
                // }

                if (!res.nodes){      //如果没有可用节点则回源
                    // cb(null);
                    cb([{uri: self.src, type: 'server'}]);
                } else {

                    var nodes = res.nodes;
                    var allNodes = [];
                    var isLocationHTTP = location.protocol === 'http:' ? true : false;
                    var httpsCount = 0;
                    var httpCount = 0;
                    for (var i=0; i<nodes.length; ++i) {
                        var protocol = nodes[i].protocol;
                        if (protocol === 'webtorrent') {
                            if (!self.magnetURI) {                     //如果用户没有指定magnetURI
                                self.magnetURI = nodes[i].magnet_uri;
                                debug('_getNodes magnetURI:'+nodes[i].magnet_uri);
                            }
                        } else {
                            protocol === 'https' ? httpsCount++ : httpCount++;
                            if (isLocationHTTP || protocol !== 'http') {
                                var host = nodes[i].host;
                                var type = nodes[i].type;
                                var path = self.urlObj.host + self.urlObj.path;
                                var url = protocol+'://'+host+'/'+path;
                                if (!self.nodeSet.has(url)) {
                                    allNodes.push({uri: url, type: type});
                                    self.nodeSet.add(url);
                                }
                            }
                        }
                    }

                    self._debugInfo.totalHTTPS = httpsCount;
                    self._debugInfo.totalHTTP = httpCount;

                    debug('allNodes:'+JSON.stringify(allNodes));
                    self.nodes = allNodes;
                    if (allNodes.length === 0) cb([{uri: self.src, type: 'server'}]);
                    nodeFilter(allNodes, function (nodes, fileLength) {            //筛选出可用的节点,以及回调文件大小
                        // nodes = [];                                            //test
                        var length = nodes.length;
                        debug('nodes:'+JSON.stringify(nodes));

                        self._debugInfo.usefulHTTPAndHTTPS = length;

                        if (length) {
                            self.fileLength = fileLength;
                            // debug('nodeFilter fileLength:'+fileLength);
                            // self.nodes = nodes;
                            if (length <= 2) {
                                // fallBack(nodes[0]);
                                nodes.push({uri: self.src, type: 'server'});
                                cb(nodes);
                                // self._fallBack();           //test
                            } else if (nodes.length >= 20){
                                nodes = nodes.slice(0, 20);
                                cb(nodes);
                            } else {
                                cb(nodes);
                            }
                        } else {
                            // self._fallBack();
                            cb([{uri: self.src, type: 'server'}]);
                        }
                    }, {start: 0, end: 10});
                }
            } else {
                cb(null);
            }
        } else {
            // self._fallBack();
            cb(null);
        }
    };
    xhr.send();
};

Worker.prototype._pearSignalHandshake = function () {
    var self = this;
    var dcCount = 0;                            //目前建立的data channel数量
    debug('_pearSignalHandshake');
    var websocket = new WebSocket(WEBSOCKET_ADDR);
    self.websocket = websocket;
    websocket.onopen = function() {
        // debug('websocket connection opened!');
        self._debugInfo.signalServerConnected = true;
        var hash = md5(self.urlObj.host + self.urlObj.path);
        websocket.push(JSON.stringify({
            "action": "get",
            "peer_id": self.peerId,
            "host": self.urlObj.host,
            "uri": self.urlObj.path,
            "md5": hash
        }));
        // debug('peer_id:'+self.peerId);
    };
    websocket.push = websocket.send;
    websocket.send = function(data) {
        if (websocket.readyState != 1) {
            console.warn('websocket connection is not opened yet.');
            return setTimeout(function() {
                websocket.send(data);
            }, 1000);
        }
        // debug("send to signal is " + data);
        websocket.push(data);
    };
    websocket.onmessage = function(e) {
        var message = JSON.parse(e.data);
        // debug("[simpleRTC] websocket message is: " + JSON.stringify(message));
        // message = message.nodes[1];
        if (message.action === 'candidate' && message.type === 'end') {

            for (var peerId in self.candidateMap) {
                if (message.peer_id === peerId) {
                    // debug('self.candidateMap[peerId]:'+self.candidateMap[peerId]);
                    self.JDMap[peerId].candidatesFromWS(self.candidateMap[peerId]);
                }
            }
        } else if (message.nodes) {
            var nodes = message.nodes;

            self._debugInfo.totalDCs = nodes.length;

            for (var i=0;i<nodes.length;++i) {
                var offer = nodes[i];
                if (!offer.errorcode) {
                    if (dcCount === self.dataChannels) break;
                    // debug('dc message:'+JSON.stringify(offer));
                    if (!self.JDMap[offer.peer_id]) {
                        self.candidateMap[offer.peer_id] = makeCandidateArr(offer.sdp.sdp);

                        offer.sdp.sdp = offer.sdp.sdp.split('a=candidate')[0];
                        // debug('initDC:'+JSON.stringify(offer));
                        self.JDMap[offer.peer_id] = self.initDC(offer);

                        //test
                        // debug('self.candidateMap[node.peer_id]:'+JSON.stringify(self.candidateMap[node.peer_id]));
                        // self.JDMap[node.peer_id].candidatesFromWS(self.candidateMap[node.peer_id]);

                        dcCount ++;
                    } else {
                        debug('datachannel 重复');
                    }
                } else {
                    debug('dc error message:'+JSON.stringify(message))
                }
            }
        }
    };
    // websocket.onclose = function () {
    //     alert('websocket关闭');
    // }
};

Worker.prototype.initDC = function (offer) {
    var self = this;

    var dc_config = {
        peer_id: self.peerId,
        chunkSize: 32*1024,
        host: self.urlObj.host,
        uri: self.urlObj.path,
        useMonitor: self.useMonitor
    };

    var jd = new RTCDownloader(dc_config);
    jd.offerFromWS(offer)
    jd.on('signal',function (message) {
        // debug('[jd] signal:' + JSON.stringify(message));
        self.websocket.send(JSON.stringify(message));
    });
    jd.once('connect',function () {

        self._debugInfo.connectedDCs ++;
        self._debugInfo.usefulDCs ++;

        if (self.dispatcher) {
            self.dispatcher.addDataChannel(jd);
        } else {
            self.tempDCQueue.push(jd);
        }
    });

    return jd;
};

Worker.prototype._startPlaying = function (nodes) {
    var self = this;
    debug('start playing');
    self.dispatcherConfig.initialDownloaders = [];
    for (var i=0;i<nodes.length;++i) {
        var node = nodes[i];
        var hd = new HttpDownloader(node.uri, node.type);
        self.dispatcherConfig.initialDownloaders.push(hd);
    }
    self.dispatcherConfig.fileSize = self.fileLength;
    // self.dispatcherConfig.sortedURIs = nodes;
    var fileConfig = {
        length: self.fileLength,
        offset: 0,
        name: self.urlObj.path,
        elem: self.selector
    };

    var d = new Dispatcher(self.dispatcherConfig);
    self.dispatcher = d;

    while (self.tempDCQueue.length) {
        var jd = self.tempDCQueue.shift();
        self.dispatcher.addDataChannel(jd);
    }

    //{errCode: 1, errMsg: 'This browser do not support WebRTC communication'}
    d.once('ready', function (chunks) {

        self.emit('begin', self.fileLength, chunks);

        // if (self.useDataChannel) {
        //     self._pearSignalHandshake();
        // }

        nodeFilter(self.nodes, function (nodes, fileLength) {            //筛选出可用的节点,以及回调文件大小

            if (nodes.length) {

                nodes.map(function (item) {

                    var hd = new HttpDownloader(item.uri, item.type);
                    d.addNode(hd);
                });
            }
        }, {start: 10, end: 30});
    });

    var file = new File(d, fileConfig);

    self.file = file;

    file._dispatcher._init();

    // debug('self.autoPlay:'+self.autoplay);

    if (self.render) {
        self.render.render(file, self.selector, {autoplay: self.autoplay});
    }

    self.isPlaying = true;

    d.on('error', function () {
        debug('dispatcher error!');
        // d.destroy();
        // self._fallBack();
        // var hd = new HttpDownloader(self.src, 'server');
        // // d.addNodes([{uri: self.src, type: 'server'}]);
        // d.addNode(hd);
    });

    d.on('needmorenodes', function () {
        debug('request more nodes');
        self._getNodes(self.token, function (nodes) {
            debug('needmorenodes _getNodes:'+JSON.stringify(nodes));
            if (nodes) {
                // d.addNodes(nodes);
                for (var i=0;i<nodes.length;++i) {
                    var node = nodes[i];
                    var hd = new HttpDownloader(node.uri, node.type);
                    d.addNode(hd);
                }
            } else {
                debug('noMoreNodes');
                d.noMoreNodes = true;
            }
        });

    });
    d.on('needsource', function () {

        if (!self.nodeSet.has(self.src)) {
            var hd = new HttpDownloader(self.src, 'server');
            d.addNode(hd);
            debug('dispatcher add source:'+self.src);
            self.nodeSet.add(self.src);
        }


    });

    d.on('needmoredatachannels', function () {
        debug('request more datachannels');
        if (self.websocket && self.websocket.readyState === WebSocket.OPEN) {

            var hash = md5(self.urlObj.host + self.urlObj.path);
            self.websocket.push(JSON.stringify({
                "action": "get",
                "peer_id": self.peerId,
                "host": self.urlObj.host,
                "uri": self.urlObj.path,
                "md5": hash
            }));
        }
    });
    d.once('done', function () {

        self.emit('done');
    });
    d.on('downloaded', function (downloaded) {

        var progress = downloaded > 1.0 ? 1.0 : downloaded;
        self.emit('progress', progress);
    });
    d.on('meanspeed', function (meanSpeed) {

        self.emit('meanspeed', meanSpeed);
    });
    d.on('fograte', function (fogRate) {

        self.emit('fograte', fogRate);
    });

    d.on('bitfieldchange', function (bitfield) {

        self.emit('bitfieldchange', bitfield, d.chunks);
    });
    d.on('fogspeed', function (speed) {

        self.emit('fogspeed', speed);
    });
    d.on('cloudspeed', function (speed) {

        self.emit('cloudspeed', speed);
    });
    d.on('buffersources', function (bufferSources) {       //s: server   n: node  d: data channel  b: browser

        self.emit('buffersources', bufferSources);
    });
    d.on('sourcemap', function (sourceType, index) {       //s: server   n: node  d: data channel  b: browser

        self.emit('sourcemap', sourceType, index);
    });
    d.on('traffic', function (mac, size, type) {

        self.emit('traffic', mac, size, type);
    });
    d.on('datachannelerror', function () {

        self._debugInfo.usefulDCs --;
    });
    d.on('fillwindow', function (windowOffset, windowLength) {

        self._debugInfo.windowOffset = windowOffset;
        self._debugInfo.windowLength = windowLength;
    });
};

function getBrowserRTC () {
    if (typeof window === 'undefined') return null;
    var wrtc = {
        RTCPeerConnection: window.RTCPeerConnection || window.mozRTCPeerConnection ||
        window.webkitRTCPeerConnection,
    };
    if (!wrtc.RTCPeerConnection) return null;
    return wrtc
}

function makeCandidateArr(sdp) {
    var rawArr = sdp.split('\r\n');

    var ufrag_reg = /^(a=ice-ufrag)/;
    var ice_ufrag;
    for (var i=0; i<rawArr.length; ++i) {
        if (ufrag_reg.test(rawArr[i])) {
            ice_ufrag = rawArr[i].split(':')[1];
            break
        }
    }

    var reg = /^(a=candidate)/;
    var candidateArr = [];

    for (var i=0; i<rawArr.length; ++i) {
        if (reg.test(rawArr[i])) {
            rawArr[i] += ' generation 0 ufrag ' + ice_ufrag + ' network-cost 50';
            var candidates = {
                "sdpMid":"data",
                "sdpMLineIndex":0
            };
            candidates.candidate = rawArr[i].substring(2);
            candidateArr.push(candidates);
        }
    }

    // debug('candidateArr:'+JSON.stringify(candidateArr));

    return candidateArr;
}

