/**
 * Created by Tim on 17-6-6.
 */

module.exports = PearPlayer;

var md5 = require('blueimp-md5');
var Dispatcher = require('./lib/dispatcher');
var HttpDownloader = require('./lib/http-downloader');
var RTCDownloader = require('./lib/webrtc-downloader-bin');
var getPeerId = require('./lib/peerid-generator');
var url = require('url');
var File = require('./lib/file');
var nodeFilter = require('./lib/node-filter');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var Set = require('./lib/set');
var WebTorrent = require('./lib/pear-torrent');

var BLOCK_LENGTH = 32 * 1024;

inherits(PearPlayer, EventEmitter);

function PearPlayer(selector, token, opts) {
    var self = this;
    if (!(self instanceof PearPlayer)) return new PearPlayer(selector, token, opts);
    // if (!(self instanceof PearPlayer)) return new PearPlayer(selector, opts);
    if (typeof token === 'object') return PearPlayer(selector, '', token);
    EventEmitter.call(self);
    opts = opts || {};
    self.video = document.querySelector(selector);
    // token = '';
    if (typeof selector !== 'string') throw new Error('video selector must be a string!');
    // if (typeof token !== 'string') throw new Error('token must be a string!');
    // if (!(opts.type && opts.type === 'mp4')) throw new Error('only mp4 is supported!');
    if (!((opts.src && typeof opts.src === 'string') || self.video.src)) throw new Error('video src is not valid!');
    // if (!(config.token && typeof config.token === 'string')) throw new Error('token is not valid!');

    console.time('视频播放延时：');
    console.time('dispatcher初始化延时：');

    self.selector = selector;
    self.src = opts.src || self.video.src;
    self.urlObj = url.parse(self.src);
    self.token = token;
    self.useDataChannel = (opts.useDataChannel === false)? false : true;
    self.useMonitor = (opts.useMonitor === true)? true : false;
    self.useTorrent = (opts.useTorrent === false)? false : true;
    self.magnetURI = opts.magnetURI || undefined;
    self.trackers = opts.trackers && Array.isArray(opts.trackers) && opts.trackers.length > 0 ? opts.trackers : null;
    self.sources = opts.sources && Array.isArray(opts.sources) && opts.sources.length > 0 ? opts.sources : null;
    self.autoPlay = (opts.autoplay === false)? false : true;
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
    self.file = null;
    self.dispatcherConfig = {

        chunkSize: opts.chunkSize && (opts.chunkSize%BLOCK_LENGTH === 0 ? opts.chunkSize : Math.ceil(opts.chunkSize/BLOCK_LENGTH)*BLOCK_LENGTH),   //每个chunk的大小,默认1M
        interval: opts.interval,     //滑动窗口的时间间隔,单位毫秒,默认10s,
        slideInterval: opts.slideInterval,
        autoplay: opts.autoplay,
        useMonitor: self.useMonitor,
        // auto: true
    };
    // console.log('self.dispatcherConfig:'+self.dispatcherConfig.chunkSize);

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

    if (self.useDataChannel) {
        self._pearSignalHandshake();
    }

    self._start();

    self._monitorUpload();

}

Object.defineProperty(PearPlayer.prototype, 'debugInfo', {
    get: function () { return this._debugInfo }
});

PearPlayer.prototype._start = function () {
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
            console.log('nodes:'+JSON.stringify(nodes));

            if (length) {
                // self.fileLength = fileLength;
                console.log('nodeFilter fileLength:'+fileLength);

                self._startPlaying(nodes);
            } else {

                self._fallBack();
            }
        }, {start: 0, end: 30});
    } else {

        self._getNodes(self.token, function (nodes) {
            console.log('_getNodes:'+JSON.stringify(nodes));
            // nodes = [{uri: 'https://000c29d049f4.webrtc.win:64892/qq.webrtc.win/free/planet.mp4', type: 'node'}]; //test
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

PearPlayer.prototype._getNodes = function (token, cb) {
    var self = this;

    var postData = {
        client_ip:'127.0.0.1',
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
    xhr.open("GET", 'https://api.webrtc.win:6601/v1/customer/nodes'+postData);
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

            console.log(this.response);

            var res = JSON.parse(this.response);
            // console.log(res.nodes);
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
                                console.log('_getNodes magnetURI:'+nodes[i].magnet_uri);
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

                    console.log('allNodes:'+JSON.stringify(allNodes));
                    self.nodes = allNodes;
                    if (allNodes.length === 0) cb([{uri: self.src, type: 'server'}]);
                    nodeFilter(allNodes, function (nodes, fileLength) {            //筛选出可用的节点,以及回调文件大小
                        // nodes = [];                                            //test
                        var length = nodes.length;
                        console.log('nodes:'+JSON.stringify(nodes));

                        self._debugInfo.usefulHTTPAndHTTPS = length;

                        if (length) {
                            self.fileLength = fileLength;
                            // console.log('nodeFilter fileLength:'+fileLength);
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

PearPlayer.prototype._fallBack = function (url) {
    var self = this;

    if (this.isPlaying) return;
    if (url) {
        this.video.src = url;
    } else {
        this.video.src = this.src;
    }
    if (this.autoPlay) {
        this.video.play();
    }

    this.isPlaying = true;
};

PearPlayer.prototype._pearSignalHandshake = function () {
    var self = this;
    var dcCount = 0;                            //目前建立的data channel数量
    console.log('_pearSignalHandshake');
    var websocket = new WebSocket('wss://signal.webrtc.win:7601/wss');
    // var websocket = new WebSocket('ws://183.60.40.104:9600/ws');
    self.websocket = websocket;
    websocket.onopen = function() {
        // console.log('websocket connection opened!');
        self._debugInfo.signalServerConnected = true;
        var hash = md5(self.urlObj.host + self.urlObj.path);
        websocket.push(JSON.stringify({
            "action": "get",
            "peer_id": self.peerId,
            "host": self.urlObj.host,
            "uri": self.urlObj.path,
            "md5": hash
        }));
        // console.log('peer_id:'+self.peerId);
    };
    websocket.push = websocket.send;
    websocket.send = function(data) {
        if (websocket.readyState != 1) {
            console.warn('websocket connection is not opened yet.');
            return setTimeout(function() {
                websocket.send(data);
            }, 1000);
        }
        // console.log("send to signal is " + data);
        websocket.push(data);
    };
    websocket.onmessage = function(e) {
        var message = JSON.parse(e.data);
        console.log("[simpleRTC] websocket message is: " + JSON.stringify(message));
        // message = message.nodes[1];
        var nodes = message.nodes;

        self._debugInfo.totalDCs = nodes.length;

        for (var i=0;i<nodes.length;++i) {
            var node = nodes[i];
            if (!node.errorcode) {
                if (dcCount === self.dataChannels) break;
                console.log('dc message:'+JSON.stringify(node))
                if (!self.JDMap[node.peer_id]) {
                    self.JDMap[node.peer_id] = self.initDC(node);
                    dcCount ++;
                } else {
                    console.log('datachannel 重复');
                }
            } else {
                console.log('dc error message:'+JSON.stringify(message))
            }
        }
    };
};

PearPlayer.prototype.initDC = function (message) {
    var self = this;

    var dc_config = {
        peer_id: self.peerId,
        chunkSize: 32*1024,
        host: self.urlObj.host,
        uri: self.urlObj.path,
        useMonitor: self.useMonitor
    };

    var jd = new RTCDownloader(dc_config);
    jd.messageFromDC(message)
    jd.on('signal',function (message) {
        console.log('[jd] signal:' + JSON.stringify(message));
        self.websocket.send(JSON.stringify(message));
    });
    jd.once('connect',function () {

        self._debugInfo.connectedDCs ++;
        self._debugInfo.usefulDCs ++;

        // self.dispatcher.addDataChannel(jd);
        // if (self.websocket) {
        //     self.websocket.close();
        // }

        if (self.dispatcher) {
            self.dispatcher.addDataChannel(jd);
        } else {
            self.tempDCQueue.push(jd);
        }
    });

    return jd;
};

PearPlayer.prototype._startPlaying = function (nodes) {
    var self = this;
    console.log('start playing');
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
    console.timeEnd('dispatcher初始化延时：');
    // if (self.useDataChannel) {
    //     self._pearSignalHandshake();
    // }
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

    file.once('canplay', function () {
        // self.emit('canplay');
        // console.log('66666666666666 canplay');
        console.timeEnd('视频播放延时：');
    });

    file.renderTo(self.selector, {autoplay: self.autoPlay});
    // file.renderTo(self.selector, {autoplay: false});

    self.isPlaying = true;

    d.on('error', function () {
        console.log('dispatcher error!');
        // d.destroy();
        // self._fallBack();
        // var hd = new HttpDownloader(self.src, 'server');
        // // d.addNodes([{uri: self.src, type: 'server'}]);
        // d.addNode(hd);
    });

    d.on('loadedmetadata', function (metadata) {

        // if (self.useDataChannel) {
        //     self._pearSignalHandshake();
        // }
        self.emit('metadata', metadata);

        if (self.useTorrent && self.magnetURI) {
            var client = new WebTorrent();
            // client.on('error', function () {
            //
            // });
            console.log('magnetURI:'+self.magnetURI);
            client.add(self.magnetURI, {
                    announce: self.trackers || [
                        "wss://tracker.openwebtorrent.com",
                        "wss://tracker.btorrent.xyz"
                    ],
                    store: d.store,
                    bitfield: d.bitfield
                },
                function (torrent) {
                    console.log('Torrent:', torrent);

                    d.addTorrent(torrent);
                }
            );
        }
    });

    d.on('needmorenodes', function () {
        console.log('request more nodes');
        self._getNodes(self.token, function (nodes) {
            console.log('needmorenodes _getNodes:'+JSON.stringify(nodes));
            if (nodes) {
                // d.addNodes(nodes);
                for (var i=0;i<nodes.length;++i) {
                    var node = nodes[i];
                    var hd = new HttpDownloader(node.uri, node.type);
                    d.addNode(hd);
                }
            } else {
                console.log('noMoreNodes');
                d.noMoreNodes = true;
            }
        });

    });
    d.on('needsource', function () {

        if (!self.nodeSet.has(self.src)) {
            var hd = new HttpDownloader(self.src, 'server');
            d.addNode(hd);
            console.log('dispatcher add source:'+self.src);
            self.nodeSet.add(self.src);
        }


    });

    d.on('needmoredatachannels', function () {
        console.log('request more datachannels');
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

PearPlayer.prototype._monitorUpload = function () {
    var self = this;
    var info = this._debugInfo;
    setInterval(function () {
        // console.log('_monitorUpload:'+(info.connectedDCs/info.totalDCs).toFixed(2));
        if (info.signalServerConnected) {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", 'https://statdapi.webrtc.win:9800/statd');
            var data = JSON.stringify({
                "cmds":[
                    {
                        "key":"fogvdn.browser.monitor.totalDC",
                        "value":info.totalDCs,
                        "type":"counting"
                    },
                    {
                        "key":"fogvdn.browser.monitor.connectedDC",
                        "value":info.connectedDCs,
                        "type":"counting"
                    },
                    {
                        "key":"fogvdn.browser.monitor.errorDC",
                        "value":info.connectedDCs - info.usefulDCs,
                        "type":"counting"
                    },
                    {
                        "key":"fogvdn.browser.monitor.connectRate",
                        "value":(info.connectedDCs/info.totalDCs*10).toFixed(2),
                        "type":"counting"
                    }
                ]
            });
            xhr.timeout = 2000;
            xhr.onload = function () {
                if (this.status >= 200 && this.status < 300) {


                    console.log('sucess');
                } else {
                    // alert('请求出错!');
                }
            }
            xhr.send(data);
        }

    }, 10000);
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

