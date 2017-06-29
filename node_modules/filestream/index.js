/* jshint node: true */
'use strict';

/**
  # filestream

  A streaming implementation for working with File objects in the browser.

  ## Why

  Because the implementations that I found really didn't cut the mustard :/

  ## Example Usage

  Displayed below is an example that uses simple file drag and drop.  Rather
  than immediately displaying the file, the file is piped through a read
  stream into a write stream and then finally displayed in the browser.

  <<< examples/drag-n-drop.js
**/

exports.read = require('./read');
exports.write = require('./write');