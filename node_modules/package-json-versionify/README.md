package-json-versionify [![Build Status](https://travis-ci.org/nolanlawson/package-json-versionify.svg?branch=master)](https://travis-ci.org/nolanlawson/package-json-versionify)
=====

Browserify transform to strip everything from `package.json` except for
the `"version"` field.

Installation
----

    npm install --save package-json-versionify

Description
----

Say you want to ship a library, and do something like:

```js
MyLibrary.version = require('./package.json').version;
```

Unfortunately, if you do this, then your entire `package.json` will be included
in the output Browserify bundle, which will increase your bundle size. Bummer!

However, if you use this transform, then it will remove everything from `package.json` except for the `"version"` field. So when you `require('./package.json')`, you get something much more compact, e.g.:

```js
{"version":"1.0.0"}
```
