# Get Started with PearPlayer

**PearPlayer** is a multi-source and multi-protocol P2P streaming player that works in the **browser**. It's easy
to get started!

## Import
### Script
Simply include the
([`pear-player.min.js`](dest/pear-player.min.js))
script on your page and use `require()`:
```html
<script src="pear-player.min.js"></script>
```

### Browserify
To install PearPlayer for use in the browser with `require('PearPlayer')`, run:
```bash
npm install pearplayer --save
```
Then you can require PearPlayer like this:
```js
var PearPlayer = require('PearPlayer');
```

## Quick Examples

### Hook the video and play

```js
var PearPlayer = require('PearPlayer');
var player = new PearPlayer('#pearvideo');
```

There is a complete example in [examples/test.html](examples/test.html)。

### Listen to PearPlayer events

```js
var player = new PearPlayer('#pearvideo', {      //第一个参数为video标签的id或class
                    type: 'mp4',                 //播放视频的类型,目前只能是mp4
                    src: 'https://qq.webrtc.win/tv/pear001.mp4',  //视频播放的src
                    useMonitor: true             //是否开启monitor,会稍微影响性能,默认false
                });

player.on('exception', onException);
player.on('begin', onBegin);
player.on('progress', onProgress);
player.on('buffersources', onBufferSources);               //s: server   n: node  d: data channel  b: browser
player.on('done', onDone);
                
function onBegin(fileLength, chunks) {
    console.log('start downloading buffer by first aid, file length is:' + fileLength + ' total chunks:' + chunks);
}

function onProgress(downloaded) {
    console.log('Progress: ' + (downloaded * 100).toFixed(1) + '%');
}

function onDone() {
    console.log('finished downloading buffer by first aid');
}

function onException(exception) {
    var errCode = exception.errCode;
    switch (errCode) {
        case 1:                   //当前浏览器不支持WebRTC
        console.log(exception.errMsg);
            break
    }
}
function onBufferSources(bufferSources) {    //s: server   n: node  d: data channel  b: browser
    console.log('Current Buffer Sources:' + bufferSources);
}
```

## Build

PearPlayer works great with [browserify](http://browserify.org/), which lets
you use [node.js](http://nodejs.org/) style `require()` to organize your browser
code, and load packages installed by [npm](https://npmjs.org/).

```bash
npm install -g browserify
```
Install dependencies:
```bash
npm install
```
To get a normal size bundle,use:
```bash
npm run build
```
To get a compressed bundle,use:
```bash
npm run build
npm run gulp
```

## More Documentation

Check out the [API Documentation](https://github.com/PearInc/PearPlayer.js/blob/master/docs/api.md)
and [FAQ](https://github.com/PearInc/PearPlayer.js/blob/master/docs/faq.md) for more details.
