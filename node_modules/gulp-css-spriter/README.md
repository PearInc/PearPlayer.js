[![npm version](https://badge.fury.io/js/gulp-css-spriter.svg)](http://badge.fury.io/js/gulp-css-spriter)

# gulp-css-spriter

`gulp-css-spriter`, a [gulp](http://gulpjs.com/) plugin, looks through the CSS you pipe in and gathers all of the background images. It then creates a sprite sheet and updates the references in the CSS.

You can easily exclude/include certain background image declarations using meta info in your styles([*see meta section below*](#meta-options)) and `includeMode` option([*see options section below*](#options)) depending on your use case.

# Install

### Latest Version: 0.3.3

`npm install gulp-css-spriter`

# About

`gulp-css-spriter` uses [spritesmith](https://www.npmjs.com/package/spritesmith) behind the scenes for creating the sprite sheet.

# Usage

## Basic usage

This is most likely the setup you will probably end up using.

```
var gulp = require('gulp');
var spriter = require('gulp-css-spriter');

gulp.task('css', function() {
	return gulp.src('./src/css/styles.css')
		.pipe(spriter({
			// The path and file name of where we will save the sprite sheet
			'spriteSheet': './dist/images/spritesheet.png',
			// Because we don't know where you will end up saving the CSS file at this point in the pipe,
			// we need a litle help identifying where it will be.
			'pathToSpriteSheetFromCSS': '../images/spritesheet.png'
		}))
		.pipe(gulp.dest('./dist/css'));
});
```

## Barebones usage

The slimmest usage possible.

```
var gulp = require('gulp');
var spriter = require('gulp-css-spriter');

gulp.task('css', function() {
	return gulp.src('./styles.css')
		.pipe(spriter())
		.pipe(gulp.dest('./'));
});
```

## Minify CSS output usage

If you want to use [@meta data](#meta-options) but are using a preprocessor such as Sass or Less, you will need to use a output style that doesn't strip comments. After piping the CSS through `gulp-css-spriter`, you can then run it through a CSS minifier(separate plugin), such as [`gulp-minify-css`](https://www.npmjs.com/package/gulp-minify-css).

```
var gulp = require('gulp');
var spriter = require('gulp-css-spriter');
var minifyCSS = require('gulp-minify-css'); // https://www.npmjs.com/package/gulp-minify-css

gulp.task('css', function() {
	return gulp.src('./styles.css')
		.pipe(spriter())
		.pipe(minifyCSS())
		.pipe(gulp.dest('./'));
});
```

# Options

 - `options`: object - hash of options
 	 - `includeMode`: string - Determines whether meta data is necessary or not
 	 	 - Values: 'implicit', 'explicit'
 	 	 - Default: 'implicit'
 	 	 - For example, if `explicit`, you must have meta `include` as `true` in order for the image declarations to be included in the spritesheet: `/* @meta {"spritesheet": {"include": true}} */`
 	 	 - If left default at `implicit`, all images will be included in the spritesheet; except for image declarations with meta `include` as `false`: `/* @meta {"spritesheet": {"include": false}} */`
 	 - `spriteSheet`: string - The path and file name of where we will save the sprite sheet
 	 	 - Default: 'spritesheet.png'
 	 - `pathToSpriteSheetFromCSS`: string - Because we don't know where you will end up saving the CSS file at this point in the pipe, we need a litle help identifying where it will be. We will use this as the reference to the sprite sheet image in the CSS piped in.
 	 	 - Default: 'spritesheet.png'
 	 - `spriteSheetBuildCallback`: function - Same as the [spritesmith callback](https://www.npmjs.com/package/spritesmith#-spritesmith-params-callback-)
 	 	 - Default: null
 	 	 - Callback has a parameters as so: `function(err, result)`
 	 	 	 - `result.image`: Binary string representation of image
 	 	 	 - `result.coordinates`: Object mapping filename to {x, y, width, height} of image
 	 	 	 - `result.properties`: Object with metadata about spritesheet {width, height}
 	 - `silent`: bool - We ignore any images that are not found but are supposed to be sprited by default
 	 	 - Default: true
 	 - `shouldVerifyImagesExist`: bool - Check to make sure each image declared in the CSS exists before passing it to the spriter. Although silenced by default(`options.silent`), if an image is not found, an error is thrown.
 	 	 - Default: true
 	 - `spritesmithOptions`: object - Any option you pass in here, will be passed through to spritesmith. [See spritesmith options documenation](https://www.npmjs.com/package/spritesmith#-spritesmith-params-callback-)
 	 	 - Default: {}
 	 - `outputIndent`: bool - Used to format output CSS. You should be using a separate beautifier plugin. The reason the output code is reformatted is because it is easier to "parse->stringify" than "replace in place".
 	 	 - Default: '\t'


# What we emit

`gulp-css-spriter` emits the transformed CSS with updated image references to the sprite sheet as a normal Gulp [vinyl file](https://www.npmjs.com/package/vinyl).

We also attach the binary sprite sheet image in `chunk.spriteSheet` in case you want to consume it later down the pipe.


# Meta info

`gulp-css-spriter` uses a JSON format to add info onto CSS declarations.

The example below will exclude this declaration from the spritesheet.
```
/* @meta {"spritesheet": {"include": false}} */
background: url('../images/dummy-blue.png');
 ```

Please note that if you are compiling from Sass/Less and are not getting correct results, to check the outputted CSS and make sure the comments are still in tact and on the line you expect. For Sass, use multiline `/* */` comment syntax and put them above declarations. This is because gulp-sass/node-sass/libsass removes single line comments and puts mult-line comments that are on the same line as a declaration, below the declaraton.

The `@meta` comment data can be above or on the same line as the declaration for it to apply.
```
/* @meta {"spritesheet": {"include": false}} */
background: url('../images/dummy-blue.png'); /* @meta {"spritesheet": {"include": false}} */
 ```

## Meta options

 - `spritesheet`: object - hash of options that `gulp-css-spriter` will factor in
 	 - `include`: bool - determines whether or not the declaration should be included in the spritesheet. This can be left undefined if the `includeMode` is 'implicit'



# What we emit

`gulp-css-spriter` transforms your CSS image paths to the spritesheet appropriately then emits the CSS as a normal Gulp [vinyl file](https://www.npmjs.com/package/vinyl).

 - Gulp [vinyl file](https://www.npmjs.com/package/vinyl). We emit the CSS you passed in with transformed image paths

## Events

### `.on('log', function(message) { })`

We emit log messages such as when a image defined in the CSS can't be found on disk.

### `.on('error', function(err) { })`

A normal gulp error. There are a variety of errors. See source code for more details.



# Testing

We have a series of unit tests. We use [Mocha](http://mochajs.org/).

Install Mocha globally:
```
npm install -g mocha
```

Run tests with: `mocha` or `npm test`
