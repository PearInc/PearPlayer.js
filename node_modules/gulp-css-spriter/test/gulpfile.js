// Manual way to run/try the plugin

// Include gulp
var gulp = require('gulp');

var spriter = require('../');


gulp.task('sprite', function() {

	// './test-css/minimal-for-bare-testing.css'
	return gulp.src('./test-css/overall.css')
		.pipe(spriter({
			'includeMode': 'implicit',
			'spriteSheet': './dist/images/spritesheet.png',
			'pathToSpriteSheetFromCSS': '../images/spritesheet.png'
		}));
});


// Default Task
gulp.task('default', ['sprite']);