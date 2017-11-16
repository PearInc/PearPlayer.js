/**
 * 过滤掉不能下载的节点
 */

module.exports = NodeFilter;

/*
    nodesArray: {uri: string type: string}
    cb: function
    config: {start: number end: number expectedLength: number}
 */

function NodeFilter(nodesArray, cb, config) {

    // var ipArray = array.unique();
    var doneCount = 0;
    var usefulNodes = [];
    var fileLength = 0;
    if (!config) {
        config = {
            start: 0,
            end: nodesArray.length
        }
    } else if (config.end > nodesArray.length) {
        config.end = nodesArray.length;
    }

    for (var i = config.start;i < config.end;++i) {

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
                fileLength = xhr.getResponseHeader('content-length');
                if ( !config.expectedLength || (config.expectedLength && (fileLength == config.expectedLength))) {
                    console.log('NodeFilter fileLength:'+fileLength+' expectedLength:'+config.expectedLength);
                    usefulNodes.push(node);
                }

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

        if (doneCount === (config.end-config.start)) {
            console.log('usefulNodes.length:'+usefulNodes.length);
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