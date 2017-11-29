
/*
 该模块用于调度HttpDownloader和RTCDownloader

 config:{

 initialDownloaders: [],  //初始的httpdownloader数组,必须
 chunkSize: number,       //每个chunk的大小,默认1M
 fileSize: number,        //下载文件的总大小,必须
 interval: number,        //滑动窗口的时间间隔,单位毫秒,默认5s
 auto: boolean,           //true为连续下载buffer
 useMonitor: boolean,      //开启监控器,默认关闭
 scheduler: function       //节点调度算法
 }
 */
module.exports = Dispatcher;

var debug = require('debug')('pear:dispatcher');
var BitField = require('bitfield');
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');
var FSChunkStore = require('fs-chunk-store');
var ImmediateChunkStore = require('immediate-chunk-store');

inherits(Dispatcher, EventEmitter);

function Dispatcher(config) {
    EventEmitter.call(this);

    var self = this;

    if (!(config.initialDownloaders && config.fileSize && config.scheduler)) throw new Error('config is not completed');
    self.fileSize = config.fileSize;
    self.initialDownloaders = config.initialDownloaders;
    self.pieceLength = config.chunkSize || 1*1024*1024;
    self.interval = config.interval || 5000;
    self.auto = config.auto || false;
    // self.auto = true;
    self.useMonitor = config.useMonitor || false;
    self.downloaded = 0;
    self.fogDownloaded = 0;                         //通过data channel下载的字节数
    self._windowOffset = 0;
    // self.noDataChannel = false;    //是否没有datachannel
    self.ready = false;
    self.done = false;             //是否已完成下载
    self.destroyed = false;

    self.chunks = (config.fileSize % self.pieceLength)>0 ? Math.floor((config.fileSize / self.pieceLength)) +1:
        (config.fileSize / self.pieceLength);

    // self._startPiece = 0;
    // self._endPiece = (self.fileSize-1)/self.pieceLength;

    self._selections = [];                           //下载队列
    self._store = FSChunkStore;
    self.path = '';

    self.bufferSources = new Array(self.chunks);    //记录每个buffer下载的方式
    self.slide = null;
    self.noMoreNodes = false;                   //是否已没有新的节点可获取

    //monitor
    self.startTime = (new Date()).getTime();      //用于计算平均速度
    self.fogRatio = 0.0;

    //firstaid参数自适应
    self._windowLength = self.initialDownloaders.length <= 5 ? self.initialDownloaders.length : 5;
    // self._windowLength = 15;
    // self._colddown = self._windowLength;                        //窗口滑动的冷却时间
    self._colddown = 5;                        //窗口滑动的冷却时间
    self.downloaders = [];

    //webtorrent
    self.torrent = null;

    //scheduler
    self.scheduler = config.scheduler;
};

Dispatcher.prototype._init = function () {
    var self = this;

    self.downloaders = self.initialDownloaders.map(function (item){

        self._setupHttp(item);
        return item;
    });

    self.store = new ImmediateChunkStore(
        new self._store(self.pieceLength, {
            path: self.path,
            length: self.fileSize
        })
    );
    // debug('self.path:'+self.path);
    self.bitfield = new BitField(self.chunks);       //记录哪个块已经下好

    self.queue = [];                     //初始化下载队列
    // self._slide();
    if (self.auto) {
        // self.startFrom(0, false);
        self.select(0, self.chunks-1, true);
        self.autoSlide();
        self.slide = noop;Pear-Demo-Yosemite_National_Park.mp4
    } else {
        // self.slide = this._throttle(this._slide, this);
    }

    //初始化buffersources
    for (var k=0;k<self.bufferSources;++k) {
        self.bufferSources[k] = null;
    }

    //计算平均速度
    setInterval(function () {
        if (!self.done) {
            var endTime = (new Date()).getTime();
            var meanSpeed = self.downloaded/(endTime-self.startTime);        //单位: KB/s
            self.emit('meanspeed', meanSpeed);
        }
    }, 2000);

    self.ready = true;
    self.emit('ready', self.chunks);
};

Dispatcher.prototype.select = function (start, end, priority, notify) {
    var self = this;
    if (self.destroyed) throw new Error('dispatcher is destroyed');

    if (start < 0 || end < start || self.chunks.length <= end) {
        throw new Error('invalid selection ', start, ':', end)
    }
    priority = Number(priority) || 0;

    debug('select %s-%s (priority %s)', start, end, priority);

    self._selections.push({
        from: start,
        to: end,
        offset: 0,
        priority: priority,
        notify: notify || noop
    });

    self._selections.sort(function (a, b) {           //从小到大排序
        return a.priority - b.priority
    })

    self._updateSelections()
};

Dispatcher.prototype.deselect = function (start, end, priority) {
    var self = this;
    if (self.destroyed) throw new Error('dispatcher is destroyed');

    priority = Number(priority) || 0;
    debug('deselect %s-%s (priority %s)', start, end, priority);
    // self._clearAllQueues();
    for (var i = 0; i < self._selections.length; ++i) {
        var s = self._selections[i];
        if (s.from === start && s.to === end && s.priority === priority) {
            self._selections.splice(i, 1);
            break
        }
    }

    self._updateSelections()
};

Dispatcher.prototype._slide = function () {
    var self = this;

    if (self.done) return;
    debug('[dispatcher] slide window downloader length:'+self.downloaders.length);
    self._fillWindow();
};

/**
 * Called on selection changes.
 */
Dispatcher.prototype._updateSelections = function () {
    var self = this;
    if (!self.ready || self.destroyed) return;

    process.nextTick(function () {
        self._gcSelections()
    });
    // debug('Dispatcher _updateSelections');
    //此处开始下载
    self._update();
};

/**
 * Garbage collect selections with respect to the store's current state.
 */
Dispatcher.prototype._gcSelections = function () {
    var self = this;

    for (var i = 0; i < self._selections.length; ++i) {
        var s = self._selections[i];
        var oldOffset = s.offset;

        // check for newly downloaded pieces in selection
        while (self.bitfield.get(s.from + s.offset) && s.from + s.offset < s.to) {
            s.offset += 1
        }
        self._windowOffset = s.from + s.offset;
        if (oldOffset !== s.offset) s.notify();
        if (s.to !== s.from + s.offset) continue;
        if (!self.bitfield.get(s.from + s.offset)) continue;

        self._selections.splice(i, 1); // remove fully downloaded selection
        i -= 1; // decrement i to offset splice

        s.notify();
    }

    // for (var i = 0; i < self._selections.length; ++i) {
    //test
    //     var length = self._selections.length;
    //     if (!length) return;
    //     var s = self._selections[self._selections.length-1];
    //     var oldOffset = s.offset;
    //
    //     // check for newly downloaded pieces in selection
    //     while (self.bitfield.get(s.from + s.offset) && s.from + s.offset < s.to) {
    //         s.offset += 1
    //     }
    //     self._windowOffset = s.from + s.offset;
    //
    //     if (oldOffset !== s.offset) s.notify();
    //     // if (s.to !== s.from + s.offset) continue;
    //     // if (!self.bitfield.get(s.from + s.offset)) continue;
    //     //
    //     // self._selections.splice(i, 1); // remove fully downloaded selection
    //     // i -= 1; // decrement i to offset splice
    //
    //     s.notify();
    // }

    // self._windowOffset = s.from + s.offset;
    // debug('current _windowOffset:' + self._windowOffset);

    if (!self._selections.length) self.emit('idle')
};

Dispatcher.prototype._update = function () {
    var self = this;
    if (self.destroyed) return;
    // debug('Dispatcher _update');
    var length = self._selections.length;
    // debug('_selections.length:'+self._selections.length);
    if (length > 0) {

        // debug('_update self._selections:'+JSON.stringify(self._selections));
        // var s = self._selections[length-1];
        var s = self._selections[0];
        var start = s.from + s.offset;
        var end = s.to;
        // self._windowOffset = start;
        debug('current _windowOffset:' + self._windowOffset);
        self._slide();
        // self.slide();
        // self._throttle(self.slide,self);
    }

};

Dispatcher.prototype._checkDone = function () {
    var self = this;
    if (self.destroyed) return;
    // is the torrent done? (if all current selections are satisfied, or there are
    // no selections, then torrent is done)
    var done = true;
    // debug('_selections.length:'+self._selections.length);
    // for (var i = 0; i < self._selections.length; i++) {
    //     var selection = self._selections[i];
    //     for (var piece = selection.from; piece <= selection.to; piece++) {
    //         if (!self.bitfield.get(piece)) {
    //             done = false;
    //             break
    //         }
    //     }
    //     if (!done) break
    // }
    for (var i = 0; i < self.chunks; i++) {
        if (!self.bitfield.get(i)) {
            // self._windowOffset = i;
            done = false;
            break
        }
    }
    // debug('_checkDone self.done:'+self.done+' done:'+done);
    if (!self.done && done) {
        self.done = true;
        // debug('dispatcher done');
        self.emit('done');
        if (self.useMonitor) {
            self.emit('downloaded', 1.0);
        }
        for (var k=0;k<self.downloaders.length;++k) {
            if (self.downloaders[k].type === 2) {               //datachannel
                self.downloaders[k].simpleRTC.dataChannel.close();                //关闭所有dataChannel
            }

        }
    }
    self._gcSelections();

    return done;
};

Dispatcher.prototype._calRange = function (index) {            //根据索引计算范围
    var self = this;

    var begin= index*self.pieceLength;
    var end = (index+1)*self.pieceLength - 1;
    if(index == (self.chunks-1))
    {
        end = index*self.pieceLength + self.fileSize%self.pieceLength - 1;
    }
    return [begin, end];
};

Dispatcher.prototype._calIndex = function (start) {            //根据范围计算索引
    var self = this;

    return Math.floor(start/self.pieceLength);
};

Dispatcher.prototype._getNodes = function (index) {      //返回节点构成的数组

    return this.downloaders[index % this.downloaders.length];
};

Dispatcher.prototype._fillWindow = function () {
    var self = this;


    var sortedNodes = self.scheduler(this.downloaders,
        {
            windowLength: self._windowLength,
            windowOffset: self._windowOffset
        }
    );     //已经按某种策略排好序的节点数组，按优先级降序

    if (sortedNodes.length === 0) return;

    var count = 0;
    var index = self._windowOffset;                       //TODO:修复auto下为零
    self.emit('fillwindow', self._windowOffset, self._windowLength);
    while (count !== self._windowLength){
        debug('_fillWindow _windowLength:'+self._windowLength + ' downloadersLength:' + self.downloaders.length);
        if (index >= self.chunks){
            break;
        }
        // debug('index:'+index);
        // if (count >= sortedNodes.length) break;

        if (!self.bitfield.get(index)) {

            var pair = self._calRange(index);
            // var node = self._getNodes(count);
            // node.select(pair[0],pair[1]);
            var node = sortedNodes[count % sortedNodes.length];
            // var node = sortedNodes[count];
            node.select(pair[0],pair[1]);
            count ++;
        } else {

        }
        index ++;
    }

};

Dispatcher.prototype._setupHttp = function (hd) {
    var self = this;

    hd.once('start',function () {

    });
    hd.once('done',function () {

        // debug('httpDownloader ondone');

    });
    hd.once('error', function (error) {

        console.warn('http' + hd.uri + 'error!');

        if (self.downloaders.length > self._windowLength) {
            self.downloaders.removeObj(hd);
            if (self._windowLength > 3) self._windowLength --;
        }
        self.checkoutDownloaders();
    });
    hd.on('data',function (buffer, start, end, speed) {

        var index = self._calIndex(start);
        debug('httpDownloader' + hd.uri +' ondata range:'+start+'-'+end+' at index:'+index+' speed:'+hd.meanSpeed);
        var size = end - start + 1;
        if (!self.bitfield.get(index)){
            self.bitfield.set(index,true);

            self.store.put(index, buffer);



            self._checkDone();
            if (self.useMonitor) {
                self.downloaded += size;
                self.emit('downloaded', self.downloaded/self.fileSize);
                // hd.downloaded += size;
                self.emit('traffic', hd.mac, size, hd.type === 1 ? 'HTTP_Node' : 'HTTP_Server');
                debug('ondata hd.type:' + hd.type +' index:' + index);
                if (hd.type === 1) {          //node
                    self.fogDownloaded += size;
                    var fogRatio = self.fogDownloaded/self.downloaded;
                    if (fogRatio >= self.fogRatio) {
                        self.emit('fograte', fogRatio);
                    }
                    self.emit('fogspeed', self.downloaders.getCurrentSpeed([1, 2]));
                    hd.type === 1 ? self.bufferSources[index] = 'n' : self.bufferSources[index] = 'b';
                } else {
                    self.emit('cloudspeed', self.downloaders.getCurrentSpeed([0]));
                    self.bufferSources[index] = 's'
                }
                self.emit('buffersources', self.bufferSources);
                self.emit('sourcemap', hd.type === 1 ? 'n' : 's', index);
            }
            // debug('bufferSources:'+self.bufferSources);
        } else {
            debug('重复下载');

        }
    });

    return hd;
};

Dispatcher.prototype._setupDC = function (jd) {
    var self = this;

    jd.once('start',function () {
        // debug('DC start downloading');
    });

    jd.on('data',function (buffer, start, end, speed) {

        var index = self._calIndex(start);
        debug('pear_webrtc '+jd.dc_id+' ondata range:'+start+'-'+end+' at index:'+index+' speed:'+jd.meanSpeed);
        var size = end - start + 1;
        if (!self.bitfield.get(index)){
            self.bitfield.set(index,true);

            self.store.put(index, buffer);

            self._checkDone();
            if (self.useMonitor) {
                self.downloaded += size;
                self.fogDownloaded += size;
                debug('downloaded:'+self.downloaded+' fogDownloaded:'+self.fogDownloaded);
                self.emit('downloaded', self.downloaded/self.fileSize);
                var fogRatio = self.fogDownloaded/self.downloaded;
                if (fogRatio >= self.fogRatio) {
                    self.emit('fograte', fogRatio);
                }
                self.emit('fogspeed', self.downloaders.getCurrentSpeed([1,2]));
                self.bufferSources[index] = 'd';
                self.emit('buffersources', self.bufferSources);
                self.emit('sourcemap', 'd', index);
                // jd.downloaded += size;
                self.emit('traffic', jd.mac, size, 'WebRTC_Node');
            }
        } else {
            debug('重复下载');
            for (var k=0;k<self.downloaders.length;++k) {
                if (self.downloaders[k].type === 2) {               //datachannel
                    self.downloaders[k].clearQueue();                //如果dc下载跟不上http,则清空下载队列
                }

            }
        }

    });

    jd.once('error', function () {
        console.warn('webrtc error mac:'+ jd.mac);
        jd.close();
        self.downloaders.removeObj(jd);
        if (self.downloaders.length < self._windowLength) {
            self._windowLength --;
        }
        self.checkoutDownloaders();
        self.emit('datachannelerror');
    });
};

Dispatcher.prototype.checkoutDownloaders = function () {            //TODO:防止重复请求

    if (this.downloaders.length <= 3 && !this.noMoreNodes) {
        this.requestMoreNodes();
        this.requestMoreDataChannels();
        if (this.downloaders.length <= 2 && this._windowLength / this.downloaders.length >= 2) {
            this.emit('needsource');
        }
    }
};

Dispatcher.prototype.addTorrent = function (torrent) {
    var self = this;
    // debug('torrent.pieces.length:'+torrent.pieces.length+' chunks:'+this.chunks);
    if (torrent.pieces.length !== this.chunks) return;
    this.torrent = torrent;
    torrent.pear_downloaded = 0;
    debug('addTorrent _windowOffset:' + self._windowOffset);
    if (self._windowOffset + self._windowLength < torrent.pieces.length-1) {
        torrent.critical(self._windowOffset+self._windowLength, torrent.pieces.length-1);
    }
    torrent.on('piecefromtorrent', function (index) {

        debug('piecefromtorrent:'+index);
        if (self.useMonitor) {
            self.downloaded += self.pieceLength;
            self.fogDownloaded += self.pieceLength;
            torrent.pear_downloaded += self.pieceLength;
            self.emit('downloaded', self.downloaded/self.fileSize);
            var fogRatio = self.fogDownloaded/self.downloaded;
            if (fogRatio >= self.fogRatio) {
                self.emit('fograte', fogRatio);
            }
            // debug('torrent.downloadSpeed:'+torrent.downloadSpeed/1024);
            self.emit('fogspeed', self.downloaders.getCurrentSpeed([1, 2]) + torrent.downloadSpeed/1024);
            self.bufferSources[index] = 'b';
            self.emit('buffersources', self.bufferSources);
            self.emit('sourcemap', 'b', index);
            self.emit('traffic', 'Webtorrent', self.pieceLength, 'WebRTC_Browser');
        }
    });

    torrent.on('done', function () {
        debug('torrent done');
    });
};

Dispatcher.prototype.addDataChannel = function (dc) {

    // this.downloaders.push(dc);
    this.downloaders.splice(this._windowLength-1,0,dc);
    if (this._windowLength < 8 && this.downloaders.length > this._windowLength) {
        this._windowLength ++;
    }
    this._setupDC(dc);
};

Dispatcher.prototype.addNode = function (node) {     //node是httpdownloader对象

    this._setupHttp(node);
    this.downloaders.push(node);
    debug('dispatcher add node: '+node.uri);

};

Dispatcher.prototype.requestMoreNodes = function () {

    if (this.downloaders.length > 0) {            //节点不够,重新请求
        this.emit('needmorenodes');
    } else {
        this.emit('error');
    }
};

Dispatcher.prototype.requestMoreDataChannels = function () {

    if (this.downloaders.length > 0) {            //节点不够,重新请求
        this.emit('needmoredatachannels');
    } else {
        this.emit('error');
    }
};

Dispatcher.prototype.destroy = function () {
    var self = this;
    if (self.destroyed) return;
    self.destroyed = true;

    for (var k=0;k<self.downloaders.length;++k) {
        self.downloaders[k].close();
    }
    if (self.store) {
        self.store.close();
    }

    self.emit('close');

    self.store = null;

    debug('Dispatcher destroyed');
};

Dispatcher.prototype._throttle = function (method, context) {

    var going = false;
    return function () {
        if (going) return;
        going = true;
        setTimeout(function(){
            method.call(context);
            going = false;
        }, this._colddown*1000);
    }
};

Dispatcher.prototype.autoSlide = function () {
    var self = this;

    setTimeout(function () {
        self._slide();
        self._checkDone();
        if (!self.done && !self.destroyed){
            setTimeout(arguments.callee, self.interval);
        }
    }, self.interval);
};

Dispatcher.prototype._clearAllQueues = function () {

    debug('clearAllQueues');
    for (var k=0;k<this.downloaders.length;++k) {
        this.downloaders[k].clearQueue();
    }
};

Dispatcher.prototype._abortAll = function () {

    for (var k=0;k<this.downloaders.length;++k) {
        this.downloaders[k].abort();
    }
};

function noop () {}

Array.prototype.removeObj = function (_obj) {
    var length = this.length;
    for(var i = 0; i < length; i++)
    {
        if(this[i] == _obj)
        {
            this.splice(i,1); //删除下标为i的元素
            break
        }
    }
};

Array.prototype.getMeanSpeed = function (typeArr) {              //根据传输的类型(不传则计算所有节点)来计算平均速度
    var sum = 0;
    var length = 0;
    if (typeArr) {
        for (var i = 0; i < this.length; i++) {
            if (typeArr.indexOf(this[i].type) >= 0) {
                sum+=this[i].meanSpeed;
                length ++;
            }
        }
    } else {
        for (var i = 0; i < this.length; i++) {
            sum+=this[i].meanSpeed;
            length ++;
        }
    }
    return Math.floor(sum/length);
};

Array.prototype.getCurrentSpeed = function (typeArr) {              //根据传输的类型(不传则计算所有节点)来计算瞬时速度
    var sum = 0;
    var length = 0;
    if (typeArr) {
        for (var i = 0; i < this.length; i++) {
            if (typeArr.indexOf(this[i].type) >= 0) {
                sum+=this[i].meanSpeed;
            }
        }
    } else {
        for (var i = 0; i < this.length; i++) {
            sum+=this[i].meanSpeed;
        }
    }
    return Math.floor(sum);
};

