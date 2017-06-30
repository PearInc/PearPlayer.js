'use strict';

var fs = require('graceful-fs');
var path = require('path');
var async = require('async');
var glob = require('lazy-globby');
var extend = require('extend-shallow');
var parent = require('glob-parent');
var mkdir = require('mkdirp');
var recurse = require('./recurse');

/**
 * Asynchronously copy a glob of files from `a` to `b`.
 *
 * @param  {String|Array} `patterns` Glob pattern or array of glob patterns.
 * @param  {String} `dest` Destination directory
 * @param  {Object} `options` Options for [mkdirp] or [globby]. You may also pass a custom [rewrite] function on the options.
 * @param  {Function} `cb` Callback
 *   @param {Object} `err` [cb] Error object
 *   @param {Array} `files` [cb] Array of files
 * @api public
 */

function copy(patterns, dest, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  var opts = defaults(patterns, dest, options);

  glob()(patterns, opts, function (err, files) {
    async.each(files, function (fp, next) {
      copy.one(fp, dest, opts, next);
    }, cb);
  });
}

/**
 * Synchronously copy a glob of files from `a` to `b`.
 *
 * @param  {String|Array} `patterns` Glob pattern or array of glob patterns.
 * @param  {String} `dest` Destination directory
 * @param  {Object} `options` Options for [mkdirp] or [globby]. You may also pass a custom [rewrite] function on the options.
 * @api public
 */

copy.sync = function copySync(patterns, dest, options) {
  var opts = defaults(patterns, dest, options);

  glob().sync(patterns, opts).forEach(function (fp) {
    try {
      copy.oneSync(fp, dest, opts);
    } catch (err) {
      throw new Error(err);
    }
  });
};

/**
 * Asynchronously and recursively copy all files in directory `a` to `b`.
 *
 * @param  {String} `dirname` Source directory
 * @param  {String} `dest` Destination directory
 * @param  {Object} `options` Options for [mkdirp]. You may also pass a custom [rewrite] function on the options.
 * @param  {Function} `cb` Callback
 *   @param {Object} `err` [cb] Error object
 *   @param {Array} `files` [cb] Array of files
 * @api public
 */

copy.dir = function copyDir(dirname, dest, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  var opts = defaults(dirname, dest, options);

  recurse(dirname, function (err, files) {
    async.each(files, function (fp, next) {
      copy.one(fp, dest, opts, next);
    }, cb);
  });
};

/**
 * Synchronously and recursively copy all files in directory `a` to `b`.
 *
 * @param  {String} `dirname` Source directory
 * @param  {String} `dest` Destination directory
 * @param  {Object} `options` Options for [mkdirp]. You may also pass a custom [rewrite] function on the options.
 * @api public
 */

copy.dirSync = function copyDirSync(dirname, dest, options) {
  var opts = defaults(dirname, dest, options);
  recurse.sync(dirname).forEach(function (fp) {
    copy.oneSync(fp, dest, opts);
  });
};

/**
 * Asynchronously copy a single file from `a` to `b`. A thin wrapper around the `copy.base`
 * method, to provide error reporting and to create directories when they
 * don't already exist.
 *
 * @param  {String} `fp` Source file path
 * @param  {String} `dest` Destination directory
 * @param  {Object} `options` Options for [mkdirp]. You may also pass a custom [rewrite] function on the options.
 * @param  {Function} `cb` Callback
 *   @param {Object} `err` [cb] Error object
 *   @param {Array} `files` [cb] Array of files
 * @api public
 */

copy.one = function copyOne(fp, dest, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  var opts = defaults(fp, dest, options);
  var destFile = opts.rewrite(fp, dest);
  mkdir(path.dirname(destFile), opts, function (err) {
    if (err) return cb(err);

    try {
      copy.base(fp, destFile, opts);
      return cb();
    } catch(err) {
      return cb(err);
    }
  });
};

/**
 * Synchronously copy a single file from `a` to `b`. A thin wrapper around the `copy.base`
 * method, to provide error reporting and to create directories when they
 * don't already exist.
 *
 * @param  {String} `fp` Source file path
 * @param  {String} `dest` Destination directory
 * @param  {Object} `options` Options for [mkdirp]. You may also pass a custom [rewrite] function on the options.
 * @api public
 */

copy.oneSync = function copyOneSync(fp, dest, options) {
  var opts = defaults(fp, dest, options);
  var destFile = opts.rewrite(fp, dest);
  try {
    mkdir.sync(path.dirname(destFile), opts);
    copy.base(fp, destFile, opts);
  } catch (err) {
    throw new Error(err);
  }
};

/**
 * Base function for copying files.
 *
 * @param  {String} `src` Source file path
 * @param  {String} `dest` Destination directory
 * @return {String}
 * @api public
 */

copy.base = function copyBase(src, dest, opts) {
  src = path.resolve(opts.cwd, src);
  fs.createReadStream(src).pipe(fs.createWriteStream(dest));
};

/**
 * Rewrite the destination file path.
 *
 * @param  {String} `fp`
 * @param  {String} `dest`
 * @return {String}
 */

function rewrite(fp, dest, options) {
  return path.resolve(dest, path.basename(fp));
}

/**
 * Set default options
 *
 * @param  {Object} options
 * @return {Object}
 */

function defaults(pattern, dest, options) {
  var opts = {};
  opts.cwd = process.cwd();
  opts.rewrite = function (fp, dest) {
    return rewrite(fp, dest, this);
  };
  if (typeof pattern === 'string') {
    opts.srcBase = parent(pattern);
  }
  if (typeof opts.srcBase === 'undefined') {
    opts.srcBase = opts.cwd;
  }
  return extend(opts, options);
}

function unixify(fp) {
  return fp.split(/[\\\/]+/).join('/');
}

/**
 * Expose `copy`
 */

module.exports = copy;
