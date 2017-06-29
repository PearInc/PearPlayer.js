var http = require('http')
var MultiStream = require('multistream')
var stream = require('stream')

var videostream = require('../')

// This demo requires sintel.mp4 to be copied into the example directory
var REQUEST_SIZE = 2000000 // 2mb
var file = function (path) {
	var self = this
	self.path = path
}
file.prototype.createReadStream = function (opts) {
	var self = this
	opts = opts || {}
	var start = opts.start || 0
	var fileSize = -1

	var req = null
	var multi = new MultiStream(function (cb) {
		var end = opts.end ? (opts.end + 1) : fileSize

		var reqStart = start
		var reqEnd = start + REQUEST_SIZE
		if (end >= 0 && reqEnd > end) {
			reqEnd = end
		}
		if (reqStart >= reqEnd) {
			req = null
			return cb(null, null)
		}

		req = http.get({
			path: self.path,
			headers: {
				range: 'bytes=' + reqStart + '-' + (reqEnd - 1)
			}
		}, function (res) {
			var contentRange = res.headers['content-range']
			if (contentRange) {
				fileSize = parseInt(contentRange.split('/')[1], 10)
			}
			cb(null, res)
		})

		// For the next request
		start = reqEnd
	})
	var destroy = multi.destroy
	multi.destroy = function () {
		if (req) {
			req.destroy()
		}
		destroy.call(multi)
	}
	return multi
}

var video = document.querySelector('video')
video.addEventListener('error', function (err) {
	console.error(video.error)
})
videostream(new file('sintel.mp4'), video)

/*
var WebTorrent = require('webtorrent');

// This demo uses WebTorrent (https://webtorrent.io)
var client = new WebTorrent();

// Sintel torrent from webtorrent.io (https://webtorrent.io/torrents/sintel.torrent)
var infoHash = '6a9759bffd5c0af65319979fb7832189f4f3c35d';

client.add({
	infoHash: infoHash,
	announce: 'wss://tracker.webtorrent.io/'
}, function (torrent) {
	// Got torrent metadata!
	console.log('Torrent info hash:', torrent.infoHash);
	// Let's say the first file is a mp4 (h264) video...
	videostream(torrent.files[0], document.querySelector('video'));
});
*/
