
/*
 config:{
 peer_id :
 chunkSize : 每个块的大小,必须是32K的整数倍 (默认1M)
 host :
 uri : 文件路径,
 fileSize : 文件大小
 useMonitor: 开启监控器
 }
 */

module.exports = RTCDownloader;

var debug = require('debug')('pear:webrtc-downloader-bin');
var Buffer = require('buffer/').Buffer;
var SimpleRTC = require('./simple-RTC');
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');

inherits(RTCDownloader, EventEmitter);

function RTCDownloader(config) {
    EventEmitter.call(this);

    var self = this;

    self.type = 2;                       //datachannel
    self.peer_id = config.peer_id;
    self.chunkSize = config.chunkSize || 1*1024*1024;
    self.uri = config.uri;
    self.host = config.host;
    self.fileSize = config.fileSize;
    self.useMonitor = config.useMonitor || false;
    self.chunkStore = [];
    self.start = -1;
    self.end = -1;
    self.connectFlag = false;
    self.downloading = false;       //是否正在下载
    self.queue = [];                //下载队列
    self.startTime = 0;
    self.endTime = 0;
    self.speed = 0;                 //当前速度
    self.meanSpeed = -1;             //平均速度
    self.counter = 0;               //记录下载的次数
    self.expectedLength = 1048576;     //期望返回的buffer长度
    self.simpleRTC = new SimpleRTC();
    self._setupSimpleRTC(self.simpleRTC);

    self.dc_id = '';                             //对等端的id
    self.downloaded = 0;
    self.mac = '';

};

RTCDownloader.prototype.offerFromWS = function (offer) {          //由服务器传来的data channel的offer、peer_id、offer_id等信息
    var self = this;

    self.message = offer;
    debug('[webrtc] messageFromDC:' + JSON.stringify(offer));
    self.dc_id = offer.peer_id;
    self.simpleRTC.signal(offer.sdp);
};

RTCDownloader.prototype.candidatesFromWS = function (candidates) {

    for (var i=0; i<candidates.length; ++i) {
        this.simpleRTC.receiveIceCandidate(candidates[i]);
    }
};

RTCDownloader.prototype.select = function (start, end) {
    var self = this;
    debug('pear_webrtc'+self.dc_id+'select:'+start+'-'+end);
    if (self.downloading){
        // debug('pear_webrtc queue.push:'+start+'-'+end);
        self.queue.push([start,end]);
    } else {
        // debug('pear_webrtc startDownloading:'+start+'-'+end);
        self.startDownloading(start,end);
    }
    // if (self.queue.length >= 3) {
    //     self.clearQueue();
    //     self.weight -= 0.1;
    //     if (self.weight < 0.1) {
    //         self.emit('error');
    //     }
    // }
};

RTCDownloader.prototype.startDownloading = function (start, end) {
    var self = this;

    self.downloading = true;
    var str = {
        "host":self.host,
        "uri":self.uri,
        "action":"get",
        "response_type":"binary",
        "start":start,
        "end":end
        // "end":10*1024*1024
    };
    debug("pear_send_file : " + JSON.stringify(str));
    self.startTime=(new Date()).getTime();
    self.expectedLength = end - start + 1;
    self.simpleRTC.send(JSON.stringify(str));
};

RTCDownloader.prototype._receive = function (chunk) {
    var self = this;
    // debug('[simpleRTC] chunk type:'+typeof chunk);

    var uint8 = new Uint8Array(chunk);
    // debug('uint8.length:'+uint8.length);
    // if (!uint8) {
    //     self.emit('error');
    //     return;
    // }

    var headerInfo = self._getHeaderInfo(uint8);
    // debug('headerInfo:'+JSON.stringify(headerInfo));

    if (headerInfo) {

        if (headerInfo.value){

            // debug(self.mac+' headerInfo.start:'+headerInfo.start);
            // if (headerInfo.start === self.lastChunkEnd + 1){
            //
            //     // self.chunkStore.push(uint8);
            //     self.lastChunkEnd = headerInfo.end;
            // } else {
            //     console.error('RTCDownloader' +self.mac+ ' error start:' + headerInfo.start + ' lastChunkEnd:' + self.lastChunkEnd);
            //     // self.emit('error');
            // }

            self.chunkStore.push(uint8);
        } else if (headerInfo.begin) {
            // debug(self.mac+' headerInfo.begin:'+self.downloading);
            self.emit('start');
            self.chunkStore = [];
        } else if (headerInfo.done) {
            // debug(self.mac+' headerInfo.done:'+self.downloading);
            // debug('self.chunkStore done');
            var finalArray = [], length = self.chunkStore.length;
            // self.downloading = false;
            self.end = headerInfo.end;

            self.start = self._getHeaderInfo(self.chunkStore[0]).start;

            self.end = self._getHeaderInfo(self.chunkStore[self.chunkStore.length-1]).end;


            self.endTime = (new Date()).getTime();
            // self.speed = Math.floor(((self.end - self.start) * 1000) / ((self.endTime - self.startTime) * 1024));  //单位: KB/s
            self.speed = Math.floor((self.end - self.start + 1) / (self.endTime - self.startTime));  //单位: KB/s
            debug('pear_webrtc speed:' + self.speed + 'KB/s');
            self.meanSpeed = (self.meanSpeed*self.counter + self.speed)/(++self.counter);
            debug('datachannel '+self.dc_id+' meanSpeed:' + self.meanSpeed + 'KB/s');

            for (var i = 0; i < length; i++) {
                if (!!self.chunkStore[i]) {
                    var value = self.chunkStore[i].subarray(256);
                    // debug('value.length:'+value.length);
                    finalArray.push(Buffer.from(value));
                }
            }
            // debug('RTCDownloader' +self.mac+ ' emit data start:' + self.start + ' end:' + self.end);
            var retBuf = Buffer.concat(finalArray);
            if (retBuf.length === self.expectedLength) self.emit('data', retBuf, self.start, self.end, self.speed);
            self.downloading = false;
            if (self.queue.length>0) {             //如果下载队列不为空
                var pair = self.queue.shift();
                self.startDownloading(pair[0], pair[1]);
            }
        } else if (headerInfo.action) {
            //心跳信息
        } else {
            debug('RTC error msg:'+JSON.stringify(headerInfo));
            self.emit('error');
        }
    } else {
        self.emit('error');
    }


};

RTCDownloader.prototype.abort = function () {

};

RTCDownloader.prototype.close = function () {
    var self = this;

    if (self.simpleRTC){
        self.simpleRTC.close();
    }
};

RTCDownloader.prototype.clearQueue = function () {              //清空下载队列

    // this.downloading = false;
    if (this.queue.length > 0) {
        this.queue = [];
    }
};

RTCDownloader.prototype._getHeaderInfo = function (uint8arr) {
    // debug('_getHeaderInfo mac:'+this.mac);
    var sub = uint8arr.subarray(0, 256);
    var headerString =  String.fromCharCode.apply(String, sub);
    // debug('headerString:'+headerString)
    return JSON.parse(headerString.split('}')[0]+'}');
};

RTCDownloader.prototype._setupSimpleRTC = function (simpleRTC) {
    var self = this;

    simpleRTC.on('data', function (data) {

        self._receive(data);
    });
    simpleRTC.on('error', function (err)
    {
        debug('[simpleRTC] error', err);
        self.emit('error');
    });
    simpleRTC.on('signal', function (data) {
        // debug('[simpleRTC] SIGNAL', JSON.stringify(data));

        var message = {
            "peer_id":self.peer_id,
            "to_peer_id":self.message.peer_id,
            "offer_id":self.message.offer_id
        };
        self.mac = self.message.peer_id.replace(/:/g, '');
        // debug('webrtc mac:'+self.mac);
        if (data.type == 'answer'){
            message.action = 'answer';
            message.sdps = data;
        } else if(data.candidate){
            message.action = 'candidate';
            debug('signal candidate:'+JSON.stringify(data));
            message.candidates = data;
        }

        // websocket.send(JSON.stringify(message));
        self.emit('signal',message);
    });
    simpleRTC.on('connect', function (state) {
        debug('[datachannel] '+self.dc_id+' CONNECT');
        // simpleRTC.send('[simpleRTC] PEER CONNECTED!');
        simpleRTC.startHeartbeat();                          //开始周期性发送心跳信息
        if (!self.connectFlag){
            self.emit('connect',state);
            self.connectFlag = true;
        }

    });
};
