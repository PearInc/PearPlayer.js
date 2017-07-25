# PearPlayer 文档

**PearPlayer（梨享播放器）** 实现了融合HTTP（包含HTTPS、HTTP2）、WebRTC的多协议、多源、低延迟、
高带宽利用率的无插件Web端流媒体加速能力。基于H5的MSE技术(Media Source Extension)将来自多个源节点的Buffer通过调度算法分块喂给播放器，
在保证用户流畅播放体验的前提下最大化P2P率。

使用PearPlayer，需确保浏览器支持[WebRTC](https://en.wikipedia.org/wiki/WebRTC)(Chrome, Firefox, Opera)和[MSE](https://en.wikipedia.org/wiki/Media_Source_Extensions)。

## 导入
PearPlayer有两种导入方式：通过script标签导入和npm安装

### script标签导入
首先通过script标签导入pear-player.min.js：
```html
<script src="./dist/pear-player.min.js"></script>
```
或者使用CDN：
```html
<script src="https://cdn.jsdelivr.net/npm/pearplayer@latest/dist/pear-player.min.js"></script>
```

### npm安装
在项目目录中通过npm安装pearplayer：
```bash
npm install pearplayer --save
```
然后就可以用require方式引入PearPlayer：
```js
var PearPlayer = require('PearPlayer');
```

# PearPlayer API

## `var player = new PearPlayer('#pearvideo', token, opts)`

创建一个新的PearPlayer实例，`#pearvideo`是video标签的id，token是登陆pear服务器获取的授权，有效期7个小时。

其中`opts`可以指定PearPlayer的具体配置，相关字段的说明如下：

```js
{
  type: 'mp4',                //视频类型,暂时只支持MP4
  algorithm: 'firstaid',      //核心算法,默认firstaid
  autoplay: true,             //是否自动播放视频,默认true
  interval: 5000,             //滑动窗口的时间间隔,单位毫秒,默认10s
  auto: false,                //true为连续下载buffer,false则是只有当前播放时间与已缓冲时间小于slideInterval时下载buffer,默认false
  slideInterval: 15,          //当前播放时间与已缓冲时间小于这个数值时触发窗口滑动,单位秒,默认20s
  useDataChannel: true,       //是否开启data channel,默认true
  dataChannels: 4,            //创建data channel的最大数量,默认2
  useTorrent: true,           //是否开启Browser P2P(基于Webtorrent)，默认true
  magnetURI: 'magnet:example...',       //可手动传入magnetURI，需先将useTorrent设为true
  trackers:["wss://tracker.openwebtorrent.com"],    //可手动传入tracker服务器，需先将useTorrent设为true
  useMonitor: true            //是否开启monitor,会稍微影响性能,默认false，只有开启useMonitor才能监听事件
}
```

## `player.on('begin', function (fileLength, chunks) {})`

当PearPlayer完成初始化后会触发该事件，通过回调函数中的fileLength获取文件总大小，chunks获取文件被分成的块数（每块1M）。

## `player.on('done', function () {})`

当PearPlayer完成下载会触发该事件。

## `player.on('progress', function (downloaded) {})`

通过该事件可以监听PearPlayer的下载进度（下载的字节数除以总的字节数）。(useMonitor需设为true)

## `player.on('cloudspeed', function (speed) {})`

通过该事件可以监听cloud（即server节点）的平均下载速度（单位KB/s）。(useMonitor需设为true)

## `player.on('fogspeed', function (speed) {})`

通过该事件可以监听fog节点（包括WebRTC和HTTP）的平均下载速度（单位KB/s）。(useMonitor需设为true)

## `player.on('fograte', function (p2pRate) {})`

通过该事件可以监听fog节点（包括WebRTC和HTTP）总的下载比率（fog下载的字节数除以目前总的下载字节数）。(useMonitor需设为true)

## `player.on('buffersources', function (bufferSources) {})`

每下载一个buffer都会触发该事件，bufferSources是一个bitmap，每个元素代表该buffer是从哪个源下载的，有以下几种取值：(useMonitor需设为true)<br/>
null: 该处的buffer还未下载<br/>
s: server，从服务器端下载（HTTP协议）<br/>
n: node，从节点下载（HTTP协议）<br/>
d: data channel，从节点下载（WebRTC协议）<br/>
b: browser，从其它浏览器下载（WebRTC协议）<br/>

## `player.on('traffic', function (mac, downloaded, type) {})`
通过该事件可以监听每个节点的实时流量，其中mac是节点的mac地址，downloaded是对应节点的下载流量（字节），type是
节点的类型（http、datachannel等）。(useMonitor需设为true)

## `player.on('exception', onException)`

当PearPlayer内部发生异常时会触发该事件，通过回调函数中的exception可以获取errCode和对应的errMsg：
```js
function onException(exception) {
        var errCode = exception.errCode;
        switch (errCode) {
            case 1:                              //当前浏览器不支持WebRTC
                console.log(exception.errMsg);
                break
        }
    }
```

请参考[`/examples/test.html`](/examples/test.html)来了解API使用方法。



