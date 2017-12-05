### PearPlayer是否支持浏览器之间的P2P传输？(2.1.0版开始已支持)
目前已集成WebTorrent，基于BT协议来实现Browser P2P。

### 这个会像webtorrent一样支持torrent、magnet吗？
从2.1.0版开始已集成webtorrent（对部分源码作了修改），并且可以通过参数配置的方式传入magnetURI，
但注意pieceLength必须是512K(1*1024*512)。

