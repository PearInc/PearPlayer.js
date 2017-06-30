// Load our dependencies
var assert = require('assert');
var concat = require('concat-stream');
var ndarrayFill = require('ndarray-fill');
var savePixels = require('save-pixels');

// Define format to extension mapping
var formatToExtMap = {
  png: 'png',
  'image/png': 'png',
  jpg: 'jpeg',
  jpeg: 'jpeg',
  'image/jpg': 'jpeg',
  'image/jpeg': 'jpeg',
  gif: 'gif',
  'image/gif': 'gif'
};

/**
 * pixelsmith exporter
 * @param {Object} options Options to export with
 * @param {Function} cb Error-first callback to return binary image string to
 */
function exportCanvas(options, cb) {
  // Determine the export extension
  var format = options.format || 'png';
  var ext = formatToExtMap[format];
  assert(ext, '`pixelsmith` doesn\'t support exporting "' + format + '". Please use "jpeg", "png", or "gif"');

  // If we have a custom background, fill it in (otherwise default is transparent black `rgba(0, 0, 0, 0)`)
  var ndarray = this.ndarray;
  if (options.background) {
    ndarrayFill(ndarray, function fillBackground (i, j, k) {
      return options.background[k];
    });
  }

  // Add each image to the canvas
  var images = this.images;
  images.forEach(function getUrlPath (imageObj) {
    // Iterate over the image's data across its rows
    // setting the original data at that offset
    // [1, 2, 0, 0,
    //  3, 4, 0, 0,
    //  0, 0, 5, 0,
    //  0, 0, 0, 6]
    var img = imageObj.img;
    var xOffset = imageObj.x;
    var yOffset = imageObj.y;
    var colIndex = 0;
    var colCount = img.width; // DEV: Use `width` for padding
    for (; colIndex < colCount; colIndex += 1) {
      var rowIndex = 0;
      var rowCount = img.height; // DEV: Use `height` for padding
      for (; rowIndex < rowCount; rowIndex += 1) {
        var rgbaIndex = 0;
        var rgbaCount = 4;
        for (; rgbaIndex < rgbaCount; rgbaIndex += 1) {
          // If we are working with a 4 dimensional array, ignore the first dimension
          // DEV: This is a GIF; [frames, width, height, rgba]
          var val;
          if (img.shape.length === 4) {
            val = img.get(0, colIndex, rowIndex, rgbaIndex);
          // Otherwise, transfer data directly
          } else {
            val = img.get(colIndex, rowIndex, rgbaIndex);
          }
          ndarray.set(xOffset + colIndex, yOffset + rowIndex, rgbaIndex, val);
        }
      }
    }
  });

  // Concatenate the ndarray into a png
  // TODO: We should start sending back streams
  savePixels(ndarray, ext).pipe(concat(function concatenateImage (buff) {
    cb(null, buff.toString('binary'));
  }));
}
module.exports = exportCanvas;
