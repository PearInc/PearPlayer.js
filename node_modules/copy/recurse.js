'use strict';

var fs = require('fs');
var path = require('path');
var async = require('async');
var Promise = require('bluebird');
var readdir = Promise.promisify(fs.readdir);
var stats = Promise.promisify(fs.stat);

function recurse(dir, cb) {
  fs.exists(dir, function(exists) {
    if (!exists) {
      return cb(null, []);
    }
    return walk(dir, cb, []);
  });
}

function walk(dir, cb) {
  fs.readdir(dir, function(err, files) {
    if (err) return cb(err);

    async.reduce(files, [], function(acc, fp, next) {
      var segment = fp;
      fp = path.join(dir, segment);

      fs.stat(fp, function(err, stat) {
        if (err) return next(err);

        if (stat.isDirectory()) {
          walk(fp, function (err, files) {
            next(null, acc.concat(files));
          });
        } else {
          next(null, acc.concat(fp));
        }
      });
    }, cb);
  });
}

recurse.sync = function recurseSync(dir, res) {
  res = res || [];
  var files = fs.readdirSync(dir);
  var len = files.length, i = -1;
  while (++i < len) {
    var segment = files[i];
    var fp = path.join(dir, segment);

    if (fs.statSync(fp).isDirectory()) {
      recurse.sync(fp, res);
    } else {
      res.push(fp);
    }
  }
  return res;
};

recurse.promise = function recursePromise(dir) {
  return readdir(dir)
    .map(function (segment) {
      var fp = path.join(dir, segment);
      return stats(fp)
        .then(function (stat) {
          if (stat.isDirectory()) {
            return recurse.promise(fp);
          }
          return fp;
        });
    })
    .reduce(function (acc, files) {
      return acc.concat(files);
    }, []);
};

/**
 * Expose `recurse`
 */

module.exports = recurse;
