# pixelsmith [![Build status](https://travis-ci.org/twolfson/pixelsmith.png?branch=master)](https://travis-ci.org/twolfson/pixelsmith)

Node based engine for [spritesmith][] built of top of [get-pixels][] and [save-pixels][].

[spritesmith]: https://github.com/Ensighten/spritesmith
[get-pixels]: https://github.com/mikolalysenko/get-pixels
[save-pixels]: https://github.com/mikolalysenko/save-pixels

This can be used for constructing a canvas, placing images on it, and extracting the result image.

## Getting Started
Install the module with: `npm install pixelsmith`

```js
// Convert images into pixelsmith objects
var images = ['img1.jpg', 'img2.png'];
pixelsmith.createImages(images, function handleImages (err, imgs) {
  // Create a canvas to draw onto (200 pixels wide, 300 pixels tall)
  pixelsmith.createCanvas(200, 200, function handleCanvas (err, canvas) {
    // Add each image at a specific location (upper left corner = {x, y})
    var coordinatesArr = [{x: 0, y: 0}, {x: 50, y: 50}];
    imgs.forEach(function addImages (img, i) {
      var coordinates = coordinatesArr[i];
      canvas.addImage(img, coordinates.x, coordinates.y);
    }, canvas);

    // Export canvas to image
    canvas['export']({format: 'png'}, function handleOuput (err, result) {
      result; // Binary string representing a PNG image of the canvas
    });
  });
});
```

## Documentation
This module was built to the specification for spritesmith engines.

**Specification version:** 1.1.0

https://github.com/twolfson/spritesmith-engine-spec/tree/1.1.0

### `canvas.export(options, cb)`
Our `export` method provides support for the following options:

- options `Object`
    - background `Number[]` - `rgba` array of value for background
        - By default, the background is `[0, 0, 0, 0]` (transparent black)
        - `[0]` - Red value for background
            - Can range from 0 to 255
        - `[1]` - Green value for background
            - Can range from 0 to 255
        - `[2]` - Blue value for background
            - Can range from 0 to 255
        - `[3]` - Alpha/transparency value for background
            - Can range from 0 to 255

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint via `npm run lint` and test via `npm test`.

## Donating
Support this project and [others by twolfson][gratipay] via [gratipay][].

[![Support via Gratipay][gratipay-badge]][gratipay]

[gratipay-badge]: https://cdn.rawgit.com/gratipay/gratipay-badge/2.x.x/dist/gratipay.png
[gratipay]: https://www.gratipay.com/twolfson/

## Unlicense
As of Nov 24 2014, Todd Wolfson has released this repository and its contents to the public domain.

It has been released under the [UNLICENSE][].

[UNLICENSE]: UNLICENSE
