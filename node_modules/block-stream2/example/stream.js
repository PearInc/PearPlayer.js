var block = require('../');
var through = require('through2');

process.stdin
    .pipe(block({ size: 16, zeroPadding: true }))
    .pipe(through(function (buf, enc, next) {
        var str = buf.toString().replace(/[\x00-\x1f]/g, chr);
        console.log('buf[' + buf.length + ']=' + str);
        next();
    }))
;
function chr (s) { return '\\x' + pad(s.charCodeAt(0).toString(16),2) }
function pad (s, n) { return Array(n - s.length + 1).join('0') + s }
