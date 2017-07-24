### PearPlayer是否支持浏览器之间的P2P传输？(2.1.0版开始已支持)
目前该功能已经在开发中，预计不久后会集成WebTorrent，
基于BT协议来实现Browser P2P。

### 这个会像webtorrent一样支持torrent、magnet吗？
从2.1.0版开始已集成webtorrent（对部分源码作了修改），并且可以通过参数配置的方式传入magnetURI，
但注意pieceLength必须是1M(1024*1024)。

