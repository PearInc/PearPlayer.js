<h1 align="center">
  <img src="fig/pearlimited-avatar.png" width="256"></img>
  <br>
  PearPlayer.js
  <br>
  <br>
</h1>

<h4 align="center">一个支持多协议，多源、混合P2P-CDN的流媒体播放器</h4>
<br>

**PearPlayer（梨享播放器）** 是完全用JavaScript写的开源HTML5流媒体播放框架，实现了融合HTTP（包含HTTPS、HTTP2）、WebRTC的多协议、多源、低延迟、高带宽利用率的无插件Web端流媒体加速能力。基于H5的MSE技术(Media Source Extension)将来自多个源节点的Buffer分块喂给播放器，再加上精心设计的算法来达到最优的调度策略和处理各种异常情况，Pear Player能在保证用户流畅视频体验的前提下最大化P2P率。

![multisources](fig/fogvdn_multisources.png)

只需将
**pear-player.min.js**通过script标签导入到Html就可以使用我们的播放器。 参考以下[代码示例](#使用)。也可以查看test.html来了解使用方法。

信令部分以及WebRTC部分我们使用了自己精心设计的协议，实现此部分可以参考我们的API文档。

### 特性

- P2P能力基于**WebRTC**,无须安装任何插件
- **播放流畅，加载快速**(具体依赖于当前网络环境)
- 多协议(HTTP、HTTPS、WebRTC)、多源
- 自行研发的调度算法,在保证用户流畅视频体验的前提下最大化P2P率
- 经过严格测试，稳定可靠
- 支持Chrome、Firefox、Opera等主流浏览器

### 打包

首先需要安装打包工具browserify:
```bash
npm install -g browserify
```

安装依赖库(使用cnpm可能会有问题)
```bash
npm install
```

然后通过build命令打包生成pear-player.js文件
```bash
npm run build
```

或者通过gulp命令生成压缩过的pear-player.min.js文件
```bash
npm run gulp
```

项目中已经包含打包好的js文件,因此也可以直接跳过这个步骤。

### 导入

##### Script标签 

PearPlayer采用Script标签([`pear-player.min.js`](dest/pear-player.min.js))将`PearPlayer`暴露
给HTML，然后通过 `require('PearPlayer')`来获取PearPlayer:

```html
<script src="pear-player.min.js"></script>
```

```js
var PearPlayer = require('PearPlayer');
```

### 使用

PearPlayer是首个使用WebRTC的多源多协议流媒体播放器,采用开放的web标准(无须任何插件)，而且简单易用！

##### 使用PearPlayer播放视频：

```js
var PearPlayer = require('PearPlayer');

    var xhr = new XMLHttpRequest();
    //CP需要先登录来获取token
    xhr.open("POST", 'https://api.webrtc.win:6601/v1/customer/login');
    var data = JSON.stringify({
        user:'admin',
        password:'123456'
    });
    xhr.onload = function () {
        if (this.status >= 200 && this.status < 300) {

            var res = JSON.parse(this.response);
            if (!!res.token){
                console.log('token:' +res.token);

                var player = new PearPlayer('#pearvideo', {      //第一个参数为video标签的id或class
                    type: 'mp4',                //播放视频的类型,目前只能是mp4
                    src: 'https://qq.webrtc.win/tv/pear001.mp4',  //视频播放的src
                    token: res.token,           //与信令服务器连接的token,必须
                    algorithm: 'firstaid',      //核心算法,默认firstaid
                    autoplay: true,            //是否自动播发视频,默认true
                    chunkSize: 1*1024*1024,        //每个chunk的大小,必须是32K的整数倍,默认1M
                    interval: 5000,             //滑动窗口的时间间隔,单位毫秒,默认10s
                    auto: false,                //true为连续下载buffer,false则是只有当前播放时间与已缓冲时间小于slideInterval时下载buffer,如果是fmp4建议设为true,默认false
                    slideInterval: 10,          //当前播放时间与已缓冲时间小于这个数值时触发窗口滑动,单位秒,默认20s
                    useDataChannel: true,       //是否开启data channel,默认true
                    dataChannels: 1,            //创建data channel的最大数量,默认3
                    useMonitor: true             //是否开启monitor,会稍微影响性能,默认true
                });
            }
        } else {
            alert('请求出错!');
        }
    };
    xhr.send(data);
```

完整的示例请参考 [test/test.html](test/test.html)。

##### 监听PearPlayer事件：
```js
var player = new PearPlayer('#pearvideo', {      //第一个参数为video标签的id或class
                    type: 'mp4',                //播放视频的类型,目前只能是mp4
                    src: 'https://qq.webrtc.win/tv/pear001.mp4',  //视频播放的src
                    token: res.token,           //与信令服务器连接的token,必须
                    useMonitor: true             //是否开启monitor,会稍微影响性能,默认true
                });

                player.on('exception', onException);
                player.on('begin', onBegin);
                player.on('progress', onProgress);
                player.on('cloudspeed', onCloudSpeed);
                player.on('fogspeed', onFogSpeed);
                player.on('fograte', onWebRTCRate);
                player.on('buffersources', onBufferSources);               //s: server   n: node  d: data channel  b: browser
                player.on('done', onDone);
                
function onBegin(fileLength, chunks) {
    console.log('start downloading buffer by first aid, file length is:' + fileLength + ' total chunks:' + chunks);
}

function onProgress(downloaded) {
    console.log('Progress: ' + (downloaded * 100).toFixed(1) + '%');
}

function onCloudSpeed(speed) {
    console.log('Cloud download speed: ' + speed + 'KBps');
}

function onFogSpeed(speed) {
    console.log('Fog download speed: ' + speed + 'KBps');
}

function onWebRTCRate(p2pRate) {
    console.log('Fog Rate: ' + (p2pRate * 100).toFixed(1) + '%');
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

### 谁在用我们的产品？

+ [Pear Limited](https://pear.hk)
+ [UCloud](https://www.ucloud.cn)
+ [Tencent Cloud](https://qcloud.com)
+ [Tencent X5/TBS](https://x5.tencent.com/tbs/)

### Pear Player API文档

**[阅读API文档](docs/api.md)**

### License

MIT. Copyright (c) [Pear Limited](https://pear.hk) and [Xie Ting](t@pear.hk).
