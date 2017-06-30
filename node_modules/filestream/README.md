# filestream

A streaming implementation for working with File objects in the browser.


[![NPM](https://nodei.co/npm/filestream.png)](https://nodei.co/npm/filestream/)



## Why

Because the implementations that I found really didn't cut the mustard :/

## Example Usage

Displayed below is an example that uses simple file drag and drop.  Rather
than immediately displaying the file, the file is piped through a read
stream into a write stream and then finally displayed in the browser.

```js
var crel = require('crel');
var detect = require('feature/detect');
var dnd = require('drag-and-drop-files');
var img = crel('img');
var video = crel('video', { autoplay: true });
var FileReadStream = require('filestream/read');
var FileWriteStream = require('filestream/write');

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

```

## License(s)

### MIT

Copyright (c) 2015 Damon Oehlman <damon.oehlman@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
