# isAscii
---
Test if a string is 100% ascii.

[![npm version](https://img.shields.io/npm/v/is-ascii.svg)](http://npm.im/is-ascii)
[![Build Status](https://travis-ci.org/ariporad/is-ascii.svg)](https://travis-ci.org/ariporad/is-ascii)
[![License: MIT](https://img.shields.io/npm/l/is-ascii.svg)](http://ariporad.mit-license.org)

---

## Why

I needed to see if a string was 100% ascii.

---

## Usage

```javascript
import isAscii from 'is-ascii';

isAscii('foo bar baz !?!!!!???? @#$%^&*(){}[]\|-_+=`~'); // true
isAscii('💩💩💩‽‽‽'); // false
```

---

## License

MIT: [http://ariporad.mit-license.org](http://ariporad.mit-license.org).
