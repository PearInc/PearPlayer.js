# piece-length
piece-length finds the optimal piece length for a given number of bytes. Optimal for what exactly? BitTorrent. [VuzeWiki](http://wiki.vuze.com/w/Torrent_Piece_Size) and [TorrentFreak](http://torrentfreak.com/how-to-make-the-best-torrents-081121/) have both released some examples of ideal piece lengths, and this algorithm will reproduce them.

[![Build status](https://travis-ci.org/michaelrhodes/piece-length.png?branch=master)](https://travis-ci.org/michaelrhodes/piece-length)

[![Browser support](https://ci.testling.com/michaelrhodes/piece-length.png)](https://ci.testling.com/michaelrhodes/piece-length)

## Install
```
npm install piece-length
```

### Example
``` js
var optimum = require('piece-length')

// 350mb should be 256kb
optimum(367001600) // => 262144
```

### License
[MIT](http://opensource.org/licenses/MIT)
