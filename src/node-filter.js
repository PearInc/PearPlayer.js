/**
 * 过滤掉不能下载的节点
 */

module.exports = NodeFilter;

/*
    nodesArray: {uri: string type: string}
    cb: function
    range: {start: number end: number}
 */

function NodeFilter(nodesArray, cb, range) {

    // var ipArray = array.unique();
    var doneCount = 0;
    var usefulNodes = [];
    var fileLength = 0;
    if (!range) {
        range = {
            start: 0,
            end: nodesArray.length
        }
    } else if (range.end > nodesArray.length) {
        range.end = nodesArray.length;
    }

    for (var i=range.start;i<range.end;++i) {

        try {
            connectTest(nodesArray[i]);
        } catch (e) {
            console.log(nodesArray[i].uri + ':' + JSON.stringify(e))
        }
    }

    function connectTest(node) {

        var xhr = new XMLHttpRequest;
        xhr.timeout = 1000;
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
            console.log(node.uri + ' timeout');
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
            cb(usefulNodes, fileLength);
        }
    }

};

// Array.prototype.unique = function()
// {
//     var n = []; //一个新的临时数组
//     for(var i = 0; i < this.length; i++) //遍历当前数组
//     {
//         //如果当前数组的第i已经保存进了临时数组，那么跳过，
//         //否则把当前项push到临时数组里面
//         if (n.indexOf(this[i]) == -1) n.push(this[i]);
//     }
//     return n;
// };