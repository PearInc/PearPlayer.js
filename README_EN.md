<h1 align="center">
  <img src="fig/pear.png" height="110"></img>
  <br>
  <a href="https://demo.webrtc.win/player">PearPlayer.js</a>
  <br>
  <br>
</h1>

<h4 align="center">The streaming media player for multi-protocol, multi-source and mixed P2P-CDN</h4>
<p align="center">
  <a href="https://www.npmjs.com/package/pearplayer"><img src="https://img.shields.io/npm/v/pearplayer.svg?style=flat" alt="npm"></a>
   <a href="https://www.jsdelivr.com/package/npm/pearplayer"><img src="https://data.jsdelivr.com/v1/package/npm/pearplayer/badge" alt="jsdelivr"></a>
 <a href="https://www.jsdelivr.com/package/npm/pearplayer"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
</p>
<br>

**[English](https://github.com/PearInc/PearPlayer.js/blob/master/README_EN.md)**

PearPlayer（梨享播放器）**[[Demo](https://demo.webrtc.win/)]**  is a streaming media player framework written completely with HTML5 and JavaScript. The player uses HTTP (including HTTPS, HTTP2) and WebRTC(data channels) for code work. The WebRTC is multi-protocol, multi-source，having low latency and high bandwidth utilization. Why can PearPlayer guarantee the maximum P2P rate and user's fluent video experience? There are two reasons. One is MSE (Media Source Extension) technology, another is our designed algorithm. We know MSE technology based on H5 technology can collect the Buffer block from multiple source nodes to the player. Besides, the designed algorithm is to achieve the best scheduling strategy and handle of various abnormal situations.

![PearPlayer](fig/PearPlayer.png)
<br>
<br>
![multisources](fig/fogvdn_multisources.png)

Now, through the html label`<script>`,simply include the`pear-player.min.js` on your webpages .Refer to the following [code examples](#快速开始)，or[`/examples/player-test.html`](/examples/player-test.html)can help you.
WOW! See the basic method[get-started](docs/get-started.md) below .<br/>

## Feature
- It can be used without plugins, extensions, or installations because of P2P ability for WebRTC
- Multi-protocol(HTTP, HTTPS, WebRTC)and multi-source
- Scheduling algorithm can guarantee the P2P rate and user's fluent video experience
- no parameter( the system can adapt by itself bases on the video rate ). Even on the high usage patterns, the player can adjust it's algorithm and parameter by itself 
- No unlimited buffers to save bandwidth / traffic for CP users 
- Support Chrome, Firefox, Opera, IE, Edge and other mainstream browsers. Besides, it will support Safari, Tencent WeChat and X5/TBS.
- access to low cost, high availability Pear [Fog CDN](https://github.com/PearInc/FogVDN)
- Protocol by TLS/DTLS, no DPI features; eliminate statistical characteristics through Pear Fog dynamic port
- Easy using ,like using HTML5 <video> label, and integrating with popular player framework such as [video.js](https://github.com/videojs/video.js)
- The ability of browser P2P（base on WebTorrent）



![bitmap](fig/bitmap_en.png)

## Quick Start
It's time to witness a miracle - please copy the following code into Web HTML5 code, and then open a webpage .

```html
<script src="https://cdn.jsdelivr.net/npm/pearplayer@latest"></script>
<video id="video" controls></video>
<script>
  var player = new PearPlayer('#video', { src: 'https://qq.webrtc.win/tv/Pear-Demo-Yosemite_National_Park.mp4' });
</script>
```

## ## Using Method 

###  Simply include the video label on the js packet
And then use the script label to import pear-player.min.js：
```html
<script src="./dist/pear-player.min.js"></script>
```
or use CDN：
```html
<script src="https://cdn.jsdelivr.net/npm/pearplayer@latest"></script>
```
Suppose we want to use video label to paly the fllowing video, see HTML below：
```html
<video id="pearvideo" src="https://qq.webrtc.win/tv/Pear-Demo-Yosemite_National_Park.mp4" controls>
```
Import PearPlayer to the video label , using the codes below:
```html
<script>
  /**
  * The first parameter is ID or CLASS of the video label
  * Opts, the optional parameter configuration
  */
  if (PearPlayer.isMSESupported()) {
    var player = new PearPlayer('#pearvideo', opts);
  }
</script>
```
Congratulations! NOW your player has the P2P abilitie and no plugin!

### How to speed up the videos？
The videos above  is already distributed, so how to speed up any other video? SO EASY! Add your video's URL into[Video distribution system](https://oss.webrtc.win/). And now you can use Pear's huge amounts of nodes to speed up your videos！Please click [here](https://manual.webrtc.win/oss/)（only support  `MP4`format，and add `Pear-Demo`prefix of the video's name ,such as `Pear-Demo-movie.mp4`）

## Who is using Pear Player today？

+ [Pear Limited](https://pear.hk)
+ [Lenovo China](https://www.lenovo.com.cn/)
+ [Newifi xCloud](http://www.newifi.com/)
+ [FastWeb](http://fastweb.com.cn/)
+ [UCloud](https://www.ucloud.cn)
+ [Tencent Cloud](https://qcloud.com)
+ [Tencent X5/TBS](https://x5.tencent.com/tbs/)
+ [Tencent APD](http://www.chinaz.com/news/2016/0707/548873.shtml)

## Pear Player document
- **[get-started ](docs/get-started.md)**
- **[API](docs/api.md)**

## Thanks
Special thanks to the following projects to provide some source of inspiration and API design reference for our project:

- [WebTorrent](https://github.com/webtorrent/webtorrent)
- [Peer5](https://www.peer5.com/#)

## Speech and media coverage

- Nov 2017（Gold Science and Technology） - [DITING Technologies Inc，which invested Pear Limited， has entered Blockchain domain ](http://www.jinse.com/blockchain/99767.html)
- Sep 2017 Future Network and Open Community Alliance） - [Fog Computing has begun after Cloud Computing ——about P2P CDN](https://mp.weixin.qq.com/s/39dfSA6cTj2eoo-KqsC3AQ)  
- Aug 2017（IT biggie talk） - [Will WebRTC be the mainstream？It's era to crowdsource ！](http://mp.weixin.qq.com/s/cx_ljl2sexE0XkgliZfnmQ)
- Jul 2017（OSChina） - [PearPlayer.js —— The streaming media player is Mixed P2P-CDN](https://www.oschina.net/p/PearPlayerjs)
- Jun 2017（Tencent Frontend Conference） - [P2P-CDN streaming media acceleration based on WebRTC](http://www.itdks.com/dakalive/detail/2577)
- May 2017（Southern University of Science and Technology） - Edge Computing and Shared Fog Streaming
- May 2017（Feng Chia University） - A Cooler Fruit Venture: Scaling up a Network from Cloud to Fog with Crowdsourcing
- Aug 2016（Hong Kong University of Science and Technology） - From Cloud to Fog: Scaling up a Network with Crowdsourcing

## License

MIT. Copyright (c) [Pear Limited](https://pear.hk) and [snowinszu](https://github.com/snowinszu).

## Service
E-mail: <service@pear.hk>；QQ group ：`373594967`； [CP/CDN、OEM and other business ] (https://github.com/PearInc/FogVDN)
