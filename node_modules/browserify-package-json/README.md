# browserify-package-json

[![NPM Package](https://img.shields.io/npm/v/browserify-package-json.svg?style=flat-square)](https://www.npmjs.org/package/browserify-package-json)
[![Build Status](https://img.shields.io/travis/fanatid/browserify-package-json.svg?branch=master&style=flat-square)](https://travis-ci.org/fanatid/browserify-package-json)

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

## Description

Did you know that when [browserify][1] includes `package.json` file in bundle this bundle can contain private information like installed module path?

For example, lets install [browserify][1]:
```
$ pwd
/home/kirill/tmp
$ npm install browserify
...
$ cat ./node_modules/browserify/package.json  | grep _
  "_args": [
  "_from": "browserify@latest",
  "_id": "browserify@13.1.1",
  "_inCache": true,
  "_location": "/browserify",
  "_nodeVersion": "6.3.1",
  "_npmOperationalInternal": {
    "tmp": "tmp/browserify-13.1.1.tgz_1477162362598_0.2967709470540285"
  "_npmUser": {
  "_npmVersion": "3.10.5",
  "_phantomChildren": {},
  "_requested": {
  "_requiredBy": [
  "_resolved": "https://registry.npmjs.org/browserify/-/browserify-13.1.1.tgz",
  "_shasum": "72a2310e2f706ed87db929cf0ee73a5e195d9bb0",
  "_shrinkwrap": null,
  "_spec": "browserify",
  "_where": "/home/kirill/tmp",
    "string_decoder": "~0.10.0",
```

This package remove all values for which keys starts with `_`.

## How I can use this package?

There are two ways,

#### CLI

browserify -t [ browserify-package-json ] index.js

#### API

```js
const browserify = require('browserify')
const browserifyPackageJSON = require('browserify-package-json')

browserify()
  .add('index.js')
  .transform(browserifyPackageJSON)
  .bundle((err, result) => {
    if (!err) console.log(result.toString())
  })
```

## License

MIT

[1]: https://github.com/substack/node-browserify
