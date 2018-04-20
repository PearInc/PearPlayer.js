/**
 * Created by xieting on 2018/4/10.
 */

var parseTorrentFile = require('parse-torrent-file')
var path = require('path')
var fs = require('fs')

var torrent = fs.readFileSync(path.join(__dirname, './Pear-Demo-Yosemite_National_Park.mp4.torrent.512'))
console.log(torrent)
var parsed
try {
    parsed = parseTorrentFile(torrent)
} catch (e) {
    // the torrent file was corrupt
    console.error(e)
}

console.log(JSON.stringify(parsed, null, 2)) // Prints "Leaves of Grass by Walt Whitman.epub"
