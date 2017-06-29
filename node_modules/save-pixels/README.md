save-pixels
===========
Saves an ndarray to an image.

Example
=======
```javascript
var zeros = require("zeros")
var savePixels = require("save-pixels")

//Create an image
var x = zeros([32, 32])
x.set(16, 16, 255)

//Save to a file
savePixels(x, "png").pipe(process.stdout)
```

This writes the foll owing image to stdout:

<img src=https://raw.github.com/mikolalysenko/save-pixels/master/example/example.png>

Install
=======

    npm install save-pixels

### `require("save-pixels")(array, type)`
Saves an ndarray as an image with the given format

* `array` is an `ndarray` of pixels.  Assumes that shape is `[width, height, channels]`
* `type` is the type of the image to save.  Currently supported formats:

  + `"png"` - Portable Network Graphics format
  + `"canvas"` - A canvas element


**Returns** A stream that you can pipe to serialize the result.

# Credits
(c) 2013 Mikola Lysenko. MIT License