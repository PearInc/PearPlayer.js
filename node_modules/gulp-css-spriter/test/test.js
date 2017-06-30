
var Promise = require('bluebird');

var chai = require('chai');
var expect = require('chai').expect;
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

var extend = require('extend');

var path = require('path');
var fs = require('fs');
var readFile = Promise.promisify(fs.readFile);

var gutil = require('gulp-util');

var css = require('css');


// The main gulp plugin to test
var spriter = require('../');

// Test out some individual components
var getBackgroundImageDeclarations = require('../lib/get-background-image-declarations');
var transformMap = require('../lib/transform-map');





describe('gulp-css-spriter', function() {
	it('should emit a buffer', function() {
		var spriterPromise = spriterTest({}).then(function(result) {
			return result.isBuffer();
		});

		return expect(spriterPromise).to.eventually.equal(true);
	});

	it('should work with minified css', function() {
		return compareSpriterResultsToExpected('test/test-css/background.min.css', 'test/test-css/expected/background.min.css');
	});

	it('should not try to sprite external images', function() {
		return compareSpriterResultsToExpected('test/test-css/external-image.css', 'test/test-css/expected/external-image.css');
	});

	it('should sprite properly when the same image source is used in multiple declarations. And one of the declarations is excluded via meta data', function() {
		return compareSpriterResultsToExpected('test/test-css/multiple-declarations-same-image.css', 'test/test-css/expected/multiple-declarations-same-image.css');
	});

	// All declarations will be included except those with explcit `includeMode` false meta data
	it('should work in implicit mode `options.includeMode`', function() {
		return compareSpriterResultsToExpected('test/test-css/overall.css', 'test/test-css/expected/overall-include-implicit.css', {
			'includeMode': 'implicit'
		});
	});

	// Only declarations with explicit `includeMode` true meta data, will be sprited
	it('should work in explicit mode `options.includeMode`', function() {
		return compareSpriterResultsToExpected('test/test-css/overall.css', 'test/test-css/expected/overall-include-explicit.css', {
			'includeMode': 'explicit'
		});
	});

	it('should throw error with non-existent file when `options.silent` is false', function() {
		var spriterPromise = spriterTest({
			'silent': false
		}, 'test/test-css/non-existent-image.css');

		return expect(spriterPromise).to.eventually.be.rejected;
	});


	it('should verify images `options.shouldVerifyImagesExist`', function() {

		// This should throw
		var spriterPromiseNoCheck = spriterTest({
			'shouldVerifyImagesExist': false
		}, 'test/test-css/non-existent-image.css');

		// This should pass because we verify first
		var spriterPromiseCheck = spriterTest({
			'shouldVerifyImagesExist': true
		}, 'test/test-css/non-existent-image.css');

		return Promise.all([
			expect(spriterPromiseNoCheck).to.eventually.be.rejected,
			expect(spriterPromiseCheck).to.eventually.be.fulfilled
		]);
	});

	it('should call `includeMode.spriteSheetBuildCallback` when done', function() {
		return spriteSheetBuildCallbackResultTest({}).then(function(result) {
			return Promise.all([
				expect(result).to.have.property('image'),
				expect(result).to.have.property('coordinates'),
				expect(result).to.have.property('properties')
			]);
		});
	});

	it('should pass options through to spritesmith using `options.spritesmithOptions`', function() {
		// We make sure the spritesmith options were passed by using opposite-style stacking algorithms
		// and then comparing the width/height of both
		var testDifferentStackingPromise = Promise.all([
			buildCallbackWithAlgorithmPromise('top-down'),
			buildCallbackWithAlgorithmPromise('left-right')
		]);
		
		return testDifferentStackingPromise.then(function(res) {
			var verticalStackingData = res[0];
			var horizontalStackingData = res[1];

			// Make sure the two proportions are different
			return Promise.all([
				expect(verticalStackingData.properties.height).to.be.above(horizontalStackingData.properties.height),
				expect(horizontalStackingData.properties.width).to.be.above(verticalStackingData.properties.width)
			]);
			
		});

		function buildCallbackWithAlgorithmPromise(algorithm) {
			var extraSpriterOps = {
				spritesmithOptions: {
					algorithm: algorithm
				}
			};

			return spriteSheetBuildCallbackResultTest(extraSpriterOps);
		}

	});


	// Get a promise that resolves with the transformed file/chunks
	function spriterTest(spriterOptions, filePath) {
		spriterOptions = spriterOptions || {};
		filePath = filePath || 'test/test-css/overall.css';

		var whenSpriterDonePromise = new Promise(function(resolve, reject) {

			readFile(filePath).then(function(contents) {
				contents = String(contents);

				// create the fake file
				var fakeFile = new gutil.File({
					base: process.cwd(),
					cwd: process.cwd(),
					path: path.join(process.cwd(), filePath),
					contents: new Buffer(contents)
				});

				// Create a spriter plugin stream
				var mySpriter = spriter(spriterOptions);

				// wait for the file to come back out
				mySpriter.on('data', function(file) {
					resolve(file);
				});

				mySpriter.on('error', function(err) {
					reject(err);
				});

				mySpriter.on('end', function() {
					resolve();
				});
			
				// write the fake file to it
				mySpriter.write(fakeFile);
				mySpriter.end();

			}, function(err) {
				reject(err);
			});
		});

		return whenSpriterDonePromise;
	}

	// Get a promise representing the result of `options.spriteSheetBuildCallback`
	function spriteSheetBuildCallbackResultTest(opts, filePath) {
		return new Promise(function(resolve, reject) {
			var spriterOpts = extend({}, {
				spriteSheetBuildCallback: function(err, result) {
					if(err) {
						reject(err);
					}
					else {
						resolve(result);
					}
				}
			}, opts);

			spriterTest(spriterOpts, filePath).then(function(file) {
				// nothing
			}, function(err) {
				reject(err);
			});
		});
	}


	function compareSpriterResultsToExpected(actualPath, expectedPath, options) {
		options = options || {};

		var spriterPromise = spriterTest(options, actualPath).then(function(result) {
			return String(result.contents);
		});

		return readFile(expectedPath).then(function(expectedResult) {
			return expect(spriterPromise).to.eventually.equal(String(expectedResult));
		});
	}


});




describe('lib/getBackgroundImageDeclarations(...)', function() {
	
	it('should work with single background declarations', function() {
		return testGetBackgroundImageDeclarationsFromFile('test/test-css/background.css', 2);
	});

	it('should work with single background-image declarations', function() {
		return testGetBackgroundImageDeclarationsFromFile('test/test-css/background-image.css', 1);
	});

	it('should work with mulitple images defined in background(-image) declarations', function() {
		return testGetBackgroundImageDeclarationsFromFile('test/test-css/multiple-backgrounds.css', 2);
	});

	it('should factor in the `include` meta data', function() {
		return testGetBackgroundImageDeclarationsFromFile('test/test-css/meta-include.css', 1);
	});

	it('should work with minified css', function() {
		return testGetBackgroundImageDeclarationsFromFile('test/test-css/background.min.css', 2);
	});


	function testGetBackgroundImageDeclarationsFromFile(filePath, numExpectedDeclarations) {
		return readFile(filePath).then(function(contents) {
			contents = String(contents);

			var styles = css.parse(contents, {
				'silent': false
			});
			var imageDeclarations = getBackgroundImageDeclarations(styles);
	
			return expect((imageDeclarations || []).length).to.equal(numExpectedDeclarations);
		});
	}
});




describe('lib/transformMap(...)', function() {
    var testArray;
    
    beforeEach(function() {
       testArray = [1, 2, 3];
    });
    
    it('should transform value with bare value', function() {
        var result = transformMap(testArray, function(el) {
            if(el == 2) {
                return 2.1;
            }
        });
        expect(result).to.deep.equal([1, 2.1, 3]);
    });
    
    it('should transform value with value property', function() {
        var result = transformMap(testArray, function(el) {
            if(el == 2) {
                return {
                    value: 2.1
                };
            }
        });
        expect(result).to.deep.equal([1, 2.1, 3]);
    });
    
    it('should insert with bare value', function() {
        var result = transformMap(testArray, function(el) {
            if(el == 2) {
                return {
                    insertElements: 2.5
                };
            }
        });
        expect(result).to.deep.equal([1, 2, 2.5, 3]);
    });
    
    it('should insert with array', function() {
        var result = transformMap(testArray, function(el) {
            if(el == 2) {
                return {
                    insertElements: [2.5, 2.8]
                };
            }
        });
        expect(result).to.deep.equal([1, 2, 2.5, 2.8, 3]);
    });
    
    it('should append bare value', function() {
        var result = transformMap(testArray, function(el) {
            if(el == 2) {
                return {
                    appendElements: 4
                };
            }
        });
        expect(result).to.deep.equal([1, 2, 3, 4]);
    });
    
     it('should append with array', function() {
        var result = transformMap(testArray, function(el) {
            if(el == 2) {
                return {
                    appendElements: [4, 5]
                };
            }
        });
        expect(result).to.deep.equal([1, 2, 3, 4, 5]);
    });
    
    it('should iterate over the "extra" added elements', function() {
        var iterateResult = [];
        var result = transformMap(testArray, function(el) {
            iterateResult.push(el);
            
            if(el == 2) {
                return {
                    insertElements: [2.5, 2.8],
                    appendElements: [4, 5]
                };
            }
        });
        
        expect(iterateResult).to.deep.equal([1, 2, 2.5, 2.8, 3, 4, 5]);
    });
});
