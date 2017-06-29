// Load in our dependencies
var async = require('async');
var getPixels = require('get-pixels');

// Define our mass image population
function createImages(files, cb) {
  // In series
  async.waterfall([
    // Load the images into memory
    // DEV: If this becomes unwieldy, load in stats only. Then, inside of exporters, stream them in individually.
    function loadImages (cb) {
      async.map(files, function loadImage (filepath, cb) {
        getPixels(filepath, cb);
      }, cb);
    },
    function saveImgSizes (images, cb) {
      var i = 0;
      var len = images.length;
      for (; i < len; i++) {
        // Save the width and height
        // DEV: These can be padded later on
        var img = images[i];

        // If there are 4 dimensions, use the last 3
        // DEV: For gifs, the first dimension is frames
        if (img.shape.length === 4) {
          img.width = img.shape[1];
          img.height = img.shape[2];
        // Otherwise, use the normal [width, height, rgba] set
        } else {
          img.width = img.shape[0];
          img.height = img.shape[1];
        }
      }
      cb(null, images);
    }
  ], cb);
}
exports.createImages = createImages;
