
module.exports = HttpDownloader;

var Buffer = require('buffer/').Buffer;
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');

inherits(HttpDownloader, EventEmitter);

function HttpDownloader(uri, type, opts) {
    EventEmitter.call(this);
    opts = opts || {};
    this.uri = uri;
    this.type = type;               //server node  browser
    this.downloading = false;       //是否正在下载
    this.queue = [];                //下载队列
    this.startTime = 0;
    this.endTime = 0;
    this.speed = 0;                 //当前速度
    this.meanSpeed = 0;             //平均速度
    this.counter = 0;               //记录下载的次数
    this.weight = type === 'server' ? 0.7 : 1.0;           //下载排序时的权重系数
    this.redundance = 0;            //记录重复下载的次数
    this.isAsync = opts.isAsync || false;                  //默认并行下载
    //节点流量统计
    this.downloaded = 0;
    this.mac = this.uri.split('.')[0].split('//')[1];
    console.log('HttpDownloader mac:'+this.mac);
};

HttpDownloader.prototype.select = function (start, end) {

    // if (end < start) throw new Error('end must larger than start');
    // this.emit('start',start,end);
    console.log('HttpDownloader ' + this.uri + ' select:' + start + '-' +end + ' weight:' + this.weight);
    if (this.isAsync) {                               //并行
        this._getChunk(start, end);
    } else {　　　　　　　　　　　　　　　　　　　　　　　　 //串行
        if (this.downloading){
            this.queue.push([start,end]);
        } else {
            this._getChunk(start, end);
        }
    }
    if (this.redundance >= 1) {
        this.weight -= 0.2;
        this.redundance  = 0;
        if (this.weight < 0.1) {
            this.emit('error');
        }
    }
};

HttpDownloader.prototype.abort = function () {
    var self = this;
    // console.log('[HttpDownloader] readyState:'+self._xhr.readyState);
    if (self._xhr && (self._xhr.readyState == 2 || self._xhr.readyState == 3)) {  //如果正在下载,则停止
        self._xhr.abort();
        console.log('HttpDownloader ' + self.uri +' aborted!');
    }
};

HttpDownloader.prototype.clearQueue = function () {              //清空下载队列

    this.downloading = false;
    if (this.queue.length > 0) {
        // console.log('[HttpDownloader] clear queue!');
        this.queue = [];
    }
};

HttpDownloader.prototype._getChunk = function (begin,end) {
    var self = this;

    self.downloading = true;
    var xhr = new XMLHttpRequest();
    self._xhr = xhr;
    xhr.open("GET", self.uri);
    xhr.responseType = "arraybuffer";
    // xhr.timeout = 3000;
    self.startTime=(new Date()).getTime();
    // console.log('get_file_index: start:'+begin+' end:'+end);
    var range = "bytes="+begin+"-"+end;
    // console.log('request range: ' + range);
    xhr.setRequestHeader("Range", range);
    xhr.onload = function (event) {
        if (this.status >= 200 || this.status < 300) {
            self.downloading = false;

            self.endTime = (new Date()).getTime();
            // self.speed = Math.floor((event.total * 1000) / ((self.endTime - self.startTime) * 1024));  //单位: KB/s
            self.speed = Math.floor(event.total / (self.endTime - self.startTime));  //单位: KB/s
            // console.log('http speed:' + self.speed + 'KB/s');
            self.meanSpeed = (self.meanSpeed*self.counter + self.speed)/(++self.counter);
            console.log('http '+self.uri+' meanSpeed:' + self.meanSpeed + 'KB/s');
            if (!self.isAsync) {
                if (self.queue.length > 0){             //如果下载队列不为空
                    var pair = self.queue.shift();
                    self._getChunk(pair[0], pair[1]);
                }
            }
            var range = this.getResponseHeader("Content-Range").split(" ",2)[1].split('/',1)[0];
            // console.log('xhr.onload range:'+range);
            // self.emit('done');
            self._handleChunk(range,this.response);
        } else {
            self.emit('error');
        }
    };
    xhr.onerror = function(_) {

        self.emit('error');
    };
    // xhr.ontimeout = function (_) {
    //     console.log('HttpDownloader ' + self.uri + ' timeout');
    //     // self.emit('error');
    //     self.weight -= 0.2;
    //     if (self.weight < 0.1) {
    //         self.emit('error');
    //     }
    // };
    xhr.send();
};

HttpDownloader.prototype._handleChunk = function (range,data) {

    var start = range.split('-')[0];
    var end = range.split('-')[1];
    var buffer = Buffer.from(data);
    this.emit('data', buffer, start, end, this.speed);

};




