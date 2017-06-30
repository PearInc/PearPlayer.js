var crel = require('crel');
var detect = require('feature/detect');
var dnd = require('drag-and-drop-files');
var img = crel('img');
var video = crel('video', { autoplay: true });
var FileReadStream = require('../read');
var FileWriteStream = require('../write');

function upload(files) {
  var queue = [].concat(files);

  function sendNext() {
    var writer = new FileWriteStream();
    var next = queue.shift();

    console.log('sending file');
    new FileReadStream(next).pipe(writer).on('file', function(file) {
      console.log('file created: ', file);
      img.src = detect('URL').createObjectURL(file);
      // video.src = detect('URL').createObjectURL(next);

      if (queue.length > 0) {
        sendNext();
      }
    });
  }

  sendNext();
}

dnd(document.body, upload);

document.body.appendChild(crel('style', 'body, html { margin: 0; width: 100%; height: 100% }'));
document.body.appendChild(img);
document.body.appendChild(video);
