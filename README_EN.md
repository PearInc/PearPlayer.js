<h1 align="center">
  <img src="fig/pear.png" height="110"></img>
  <br>
  <a href="https://demo.webrtc.win/pearplayer">PearPlayer.js</a>
  <br>
  <br>
</h1>

<h4 align="center">A multi-protocol, multi-source and P2P-CDN supporting streaming media player</h4>
<br>

###### Online **[Demo](https://demo.webrtc.win/pearplayer)**

**[PearPlayer](https://github.com/PearInc/PearPlayer.js)** is an open source HTML5 streaming media framework written by JavaScript, combine HTTP (including HTTPS, HTTP2) and WebRTC. It would be  multi-protocol, multi-source, low latency, high bandwidth utilization, used to end streaming media acceleration. MSE (Media Source Extension) based on H5 technology collects the Buffer block from multiple source nodes to the player. With a well  designed algorithm, PearPlayer can guarantee the maximum rate of P2P as well as great watching experience.

![multisources](fig/PearPlayer.png)
<br>
<br>
![multisources](fig/fogvdn_multisources.png)

 `pear-player.min.js` can be imported by the html label `<script>`, refer to [code example](#使用方法)，also [`/examples/test.html`](/examples/test.html)can help you.

To know more information [API document ](docs/get-started.md).<br/>

### Feature

- P2P based on **WebRTC**,no plug in
- **Speed up**,reliable
- Multi-protocol(HTTP,HTTPS,WebRTC), multi-source
- No parameter
- Save the data usage
- Run well in Chrome,Firefox,Opera,Safari11
- Support  [Pear FogVDN](https://github.com/PearInc/FogVDN)
- Encode by TLS/DTLS, no DPI feature,Pear Fog dynamic port mapping
- Use easily like `<video>` label, can integrate [video.js](https://github.com/videojs/video.js)
- Realize browser P2P ability（base on webtorrent）
<br>

###### Demo：https://demo.webrtc.win/pearplayer/
<br>
![multisources](fig/bitmap_en.png)

## Quick Start

### Import the js packet
use script label to import pear-player.min.js
```html
<script src="./dist/pear-player.min.js"></script>
```
or
```html
<script src="https://cdn.jsdelivr.net/npm/pearplayer@latest/dist/pear-player.min.js"></script>
```
suppose we want to use video label to paly（/tv/pear001.mp4）
```html
<video id="pearvideo" src="https://qq.webrtc.win/tv/Pear-Demo-Yosemite_National_Park.mp4" controls>
```
Final
```html
<script>
/**
 * first parameter is the video label's id or class
 * opts is optional parameter
 */
var player = new PearPlayer('#pearvideo', opts);
</script>
```
Congratulations! You can use the PearPlayer now!

### Compatibility
[videojs.html](examples/videojs/videojs.html)

### Who is using Pear Player today?

+ [Pear Limited](https://pear.hk)
+ [Lenovo China](https://www.lenovo.com.cn/)
+ [Newifi xCloud](http://www.newifi.com/)
+ [FastWeb](http://fastweb.com.cn/)
+ [UCloud](https://www.ucloud.cn)
+ [Tencent Cloud](https://qcloud.com)
+ [Tencent X5/TBS](https://x5.tencent.com/tbs/)

### Pear Player document
- **[get-started](docs/get-started.md)**
- **[API](docs/api.md)**

### Thanks

- [WebTorrent](https://github.com/webtorrent/webtorrent)
- [Peer5](https://www.peer5.com/#)

### Talks

- 2017.09.01  (未来网络开放社区联盟) - [继云计算之后，雾计算再起 - 谈谈 P2P CDN](https://mp.weixin.qq.com/s/39dfSA6cTj2eoo-KqsC3AQ)
- 2017.08.18 （IT大咖说） - [WebRTC会成主流吗？众包CDN时代到了！](http://mp.weixin.qq.com/s/cx_ljl2sexE0XkgliZfnmQ)
- 2017.07.11 （OSChina开源中国） - [PearPlayer.js —— 混合P2P-CDN的流媒体播放器](https://www.oschina.net/p/PearPlayerjs)
- 2017.06.24 （腾讯Web前端大会） - [基于WebRTC的P2P-CDN流媒体加速](http://www.itdks.com/dakalive/detail/2577)
- 2017.05.17 （南方科技大学） - Edge Computing and Shared Fog Streaming
- 2017.05.08 （台湾逢甲大学） - A Cooler Fruit Venture: Scaling up a Network from Cloud to Fog with Crowdsourcing
- 2016.08.17 （香港科技大学） - From Cloud to Fog: Scaling up a Network with Crowdsourcing

### License

MIT. Copyright (c) [Pear Limited](https://pear.hk) and [snowinszu](https://github.com/snowinszu).

### Service
E-mail: <service@pear.hk>; QQ group：`373594967`; [Business](https://github.com/PearInc/FogVDN)
