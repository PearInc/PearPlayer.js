// Load our dependencies
var assert = require('assert');
var fs = require('fs');
var spritesmithEngineTest = require('spritesmith-engine-test');
var pixelsmith = require('../');

// Run our test
// DEV: This covers png and jpeg inputs
spritesmithEngineTest.run({
  engine: pixelsmith,
  engineName: 'pixelsmith'
});

// Define custom tests
var spritesmithUtils = spritesmithEngineTest.spritesmithUtils;
describe('pixelsmith', function () {
  describe('outputting a spritesheet with a custom background', function () {
    var multiplePngImages = spritesmithEngineTest.config.multiplePngImages;
    spritesmithUtils.interpretImages(pixelsmith, multiplePngImages.filepaths);

    describe('when rendered', function () {
      // Render a gif image
      spritesmithUtils.renderCanvas({
        engine: pixelsmith,
        width: multiplePngImages.width,
        height: multiplePngImages.height,
        coordinateArr: multiplePngImages.coordinateArr,
        exportParams: {
          background: [255, 0, 255, 255],
          format: 'jpeg'
        }
      });

      // Allow for debugging
      if (process.env.TEST_DEBUG) {
        spritesmithUtils.debugResult('debug-background.jpeg');
      }

      it('used the expected background', function () {
        var actualImg = fs.readFileSync(__dirname + '/expected-files/background.jpeg', 'binary');
        assert.strictEqual(this.result, actualImg);
      });
    });
  });
});
