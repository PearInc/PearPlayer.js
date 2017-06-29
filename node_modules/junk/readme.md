# junk [![Build Status](https://travis-ci.org/sindresorhus/junk.svg?branch=master)](https://travis-ci.org/sindresorhus/junk)

> Filter out [system junk files](test.js) like `.DS_Store` and `Thumbs.db`


## Install

```
$ npm install --save junk
```


## Usage

```js
const fs = require('fs');
const junk = require('junk');

fs.readdir('some/path', (err, files) => {
	console.log(files);
	//=> ['.DS_Store', 'test.jpg']

	console.log(files.filter(junk.not));
	//=> ['test.jpg']
});
```


## API

### junk.is(filename)

Returns `true` if `filename` matches a junk file.

### junk.not(filename)

Returns `true` if `filename` doesn't match a junk file.

### junk.regex

Regex used for matching.


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
