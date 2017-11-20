/**
 * 节点调度算法的默认实现
 */

/*
 nodesProvider: Array                                    //未排序的节点数组
 info：{                                                 // 窗口滑动过程中的信息
    windowLength: number,                                //滑动窗口长度
    windowOffset: number,                                //滑动窗口的起始索引
    interval2BufPos: number,                             //当前播放点距离缓冲前沿的时间，单位秒
    slideInterval: number                                //当前播放点距离缓冲前沿多少秒时滑动窗口
 }
 */

module.exports = {

    IdleFirst: function (nodesProvider, info) {

        var idles = nodesProvider.filter(function (item) {                         //空闲节点
            return item.downloading === false;
        })

        var busys = nodesProvider.filter(function (item) {                         //忙碌节点
            return item.downloading === true && item.queue.length <= 1;
        }).sort(function (a, b) {
            return a.queue.length - b.queue.length;
        });

        var ret = idles.concat(busys);
        for (var i=0;i<ret.length;++i) {
            console.log('index:'+i+' type:'+ret[i].type+' queue:'+ret[i].queue.length);
        }

        return ret;
    },

    WebRTCFirst: function (nodesProvider, info) {

        var idles = nodesProvider.filter(function (item) {         //datachannel优先级 > node > server
            return item.downloading === false;
        }).sort(function (a, b) {
            return b.type - a.type;
        });

        var busys = nodesProvider.filter(function (item) {
            return item.downloading === true && item.queue.length <= 1;
        }).sort(function (a, b) {
            return a.queue.length - b.queue.length;
        });

        var ret = idles.concat(busys);
        for (var i=0;i<ret.length;++i) {
            console.log('index:'+i+' type:'+ret[i].type+' queue:'+ret[i].queue.length);
        }

        return ret;
    },

    CloudFirst: function (nodesProvider, info) {

        var idles = nodesProvider.filter(function (item) {         //datachannel优先级 < node < server
            return item.downloading === false;
        }).sort(function (a, b) {
            return a.type - b.type;
        });

        var busys = nodesProvider.filter(function (item) {
            return item.downloading === true && item.queue.length <= 1;
        }).sort(function (a, b) {
            return a.queue.length - b.queue.length;
        });

        var ret = idles.concat(busys);
        for (var i=0;i<ret.length;++i) {
            console.log('index:'+i+' type:'+ret[i].type+' queue:'+ret[i].queue.length);
        }

        return ret;
    }

};
