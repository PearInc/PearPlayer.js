# load-ip-set [![travis][travis-image]][travis-url] [![npm][npm-image]][npm-url] [![downloads][downloads-image]][downloads-url] [![javascript style guide][standard-image]][standard-url]

[travis-image]: https://img.shields.io/travis/webtorrent/load-ip-set/master.svg
[travis-url]: https://travis-ci.org/webtorrent/load-ip-set
[npm-image]: https://img.shields.io/npm/v/load-ip-set.svg
[npm-url]: https://npmjs.org/package/load-ip-set
[downloads-image]: https://img.shields.io/npm/dm/load-ip-set.svg
[downloads-url]: https://npmjs.org/package/load-ip-set
[standard-image]: https://img.shields.io/badge/code_style-standard-brightgreen.svg
[standard-url]: https://standardjs.com

#### download and parse ip-set (blocklist) files

This module is used by [WebTorrent](http://webtorrent.io)!

### install

```
npm install load-ip-set
```

### usage

Given one of the following:

- http/https url (gzip, deflate, or no compression)
- filesystem path (gzip, or no compression)
- array of ip addresses or `{ start: '1.2.3.0', end: '1.2.3.255' }` ip ranges

this module loads the ip set (downloading from the network, if necessary) and returns an [ip-set](https://www.npmjs.org/package/ip-set) object. An `ip-set` is just a mutable set data structure optimized for use with IPv4 and IPv6 addresses.

```js
var loadIPSet = require('load-ip-set')
loadIPSet('http://example.com/list.txt', function (err, ipSet) {
  if (err) throw err
  ipSet.contains('1.2.3.4') //=> true
  ipSet.contains('2.2.2.2') //=> false
})
```

The second argument can be an optional `opts` object which will be passed to
[`simple-get`](https://npmjs.com/package/simple-get) and the node.js core `http.request`
method. This is useful for setting the user agent, for example.

```js
loadIPSet('http://example.com/list.txt', {
  headers: {
    'user-agent': 'WebTorrent (http://webtorrent.io)'
  }
}, function (err, ipSet) {

})
```

### license

MIT. Copyright (c) [Feross Aboukhadijeh](https://feross.org) and [WebTorrent, LLC](https://webtorrent.io).
