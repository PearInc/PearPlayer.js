/**
 * 过滤掉不能下载的节点
 */

module.exports = NodeFilter;

/*
 nodesArray: {uri: string type: string capacity: number}
 cb: function
 range: {start: number end: number}
 */

var debug = require('debug')('pear:node-filter');

function NodeFilter(nodesArray, cb, range) {

    cb(nodesArray, 0);
    // var doneCount = 0;
    // var usefulNodes = [];
    // var fileLength = 0;
    // if (!range) {
    //     range = {
    //         start: 0,
    //         end: nodesArray.length
    //     }
    // } else if (range.end > nodesArray.length) {
    //     range.end = nodesArray.length;
    // }
    //
    // for (var i=range.start;i<range.end;++i) {
    //
    //     try {
    //         connectTest(nodesArray[i]);
    //     } catch (e) {
    //         // debug(nodesArray[i].uri + ':' + JSON.stringify(e))
    //     }
    // }

    function connectTest(node) {

        var xhr = new XMLHttpRequest;
        xhr.timeout = 6000;
        xhr.open('head', node.uri);
        xhr.onload = function () {
            doneCount ++;
            if (this.status >= 200 && this.status<300) {
                usefulNodes.push(node);
                fileLength = xhr.getResponseHeader('content-length');
            }
            chenkDone();
        };
        xhr.ontimeout = function() {
            doneCount ++;
            debug(node.uri + ' timeout');
            chenkDone();
        };
        xhr.onerror = function() {
            doneCount ++;
            chenkDone();
        };
        xhr.send();

    };

    function chenkDone() {

        // if (doneCount === nodesArray.length) {
        //     cb(usefulNodes, fileLength);
        // }

        if (doneCount === (range.end-range.start)) {

            //根据capacity对节点进行排序
            usefulNodes.sort(function (a, b) {          //按能力值从大到小排序
                return b.capacity - a.capacity;
            });

            for(var i = 0; i < usefulNodes.length; i++) {
                debug('node ' + i + ' capacity ' + usefulNodes[i].capacity);
            }
            debug('length: ' + usefulNodes.filter(function (node) {
                    return node.capacity >= 5;
                }).length);

            cb(usefulNodes, fileLength);
        }
    }

};
