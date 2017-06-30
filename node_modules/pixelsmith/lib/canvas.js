// Load in dependencies
var ndarray = require('ndarray');
var exportCanvas = require('./export-canvas');

// Define our canvas constructor
function Canvas(width, height) {
  // Calculate and save dimensions/data for later
  var len = width * height * 4;
  this.width = width;
  this.height = height;
  this.data = new global.Uint8ClampedArray(len);
  this.ndarray = new ndarray(this.data, [width, height, 4]);

  // Create a store for images
  this.images = [];
}
Canvas.prototype = {
  addImage: function addImage (img, x, y) {
    // Save the image for later
    this.images.push({
      img: img,
      x: x,
      y: y
    });
  },
  'export': exportCanvas
};

// Define an async constructor for our canvas
function createCanvas(width, height, cb) {
  // Create a new canvas and callback
  var canvas = new Canvas(width, height);
  cb(null, canvas);
}

// Expose Canvas and createCanvas to engine
module.exports = {
  Canvas: Canvas,
  createCanvas: createCanvas
};
