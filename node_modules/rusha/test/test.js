(function () {
  'use strict';

  var assert = require('assert');
  var asm = require('asm.js');
  var Rusha  = require('../rusha.min.js');

  function assertBytesEqual(buffer1, buffer2) {
    var v1 = new Int8Array(buffer1);
    var v2 = new Int8Array(buffer2);
    assert.strictEqual(v1.length, v2.length, 'Buffers do not have the same length');
    for (var i = 0; i < v1.length; i++) {
      assert.strictEqual(v1[i], v2[i], 'Item at ' + i + ' differs: ' + v1[i] + ' vs ' + v2[i]);
    }
  }

  function digestAppendOneByOne(input) {
    var middleState;   
    for (var i = 0, len = (input.byteLength || input.length); i < len; i++) {
      if (i !== 0){
        r.setState(middleState);
      } else {
        r.resetState();
      }
      middleState = r.append(input.slice(i, i + 1)).getState();
    }
    return r.setState(middleState).end();
  }


  var r = new Rusha();

  var abcString = 'abc';
  var abcBuffer;
  var abcArray = [97, 98, 99];
  var abcArrayBuffer = new Int8Array(abcArray).buffer;

  if (typeof Buffer === 'function') {
    abcBuffer = new Buffer('abc', 'ascii');
  } else {
    abcBuffer = new Int8Array(abcArray);
  }

  var abcHashedInt32Array = new Int32Array(new Int8Array([0xA9, 0x99, 0x3E, 0x36, 0x47, 0x06, 0x81, 0x6A, 0xBA, 0x3E, 0x25, 0x71, 0x78, 0x50, 0xC2, 0x6C, 0x9C, 0xD0, 0xD8, 0x9D]).buffer);

  describe('Rusha', function() {

    it('is valid asm.js', function() {
      assert(asm.validate(Rusha._core.toString()));
    });

    describe('digestAppendOneByOne', function() {
      it('returns hex string from string', function() {
        assert.strictEqual('a9993e364706816aba3e25717850c26c9cd0d89d', digestAppendOneByOne(abcString));
      });
      it('returns hex string from buffer', function() {
        assert.strictEqual('a9993e364706816aba3e25717850c26c9cd0d89d', digestAppendOneByOne(abcBuffer));
      });
      it('returns hex string from array', function() {
        assert.strictEqual('a9993e364706816aba3e25717850c26c9cd0d89d', digestAppendOneByOne(abcArray));
      });
      it('returns hex string from ArrayBuffer', function() {
        assert.strictEqual('a9993e364706816aba3e25717850c26c9cd0d89d', digestAppendOneByOne(abcArrayBuffer));
      });
    });

    describe('digest', function() {
      it('returns hex string from string', function() {
        assert.strictEqual('a9993e364706816aba3e25717850c26c9cd0d89d', r.digest(abcString));
      });
      it('returns hex string from buffer', function() {
        assert.strictEqual('a9993e364706816aba3e25717850c26c9cd0d89d', r.digest(abcBuffer));
      });
      it('returns hex string from array', function() {
        assert.strictEqual('a9993e364706816aba3e25717850c26c9cd0d89d', r.digest(abcArray));
      });
      it('returns hex string from ArrayBuffer', function() {
        assert.strictEqual('a9993e364706816aba3e25717850c26c9cd0d89d', r.digest(abcArrayBuffer));
      });
    });

    // To execute the tests, run `npm test`, then open `test/test.html` in
    // Safari.  The tests work in Firefox when loaded via HTTP, e.g. from
    // `localhost`.  The 1 and 2 GiB tests fail in Chrome with `NotFoundError`
    // when loaded via HTTP.
    if (typeof Worker !== 'undefined') {
      describe('webworker', function () {
        it('1 kiB', function(done) {
          var rw = new Worker('../rusha.min.js')
          var zero1k = new Int8Array(1024);
          var blob = new Blob([zero1k]);
          rw.onmessage = function (e) {
            if (e.data.error) {
              throw e.data.error;
            }
            assert.strictEqual('60cacbf3d72e1e7834203da608037b1bf83b40e8', e.data.hash);
            done();
          }
          rw.postMessage({ id: 0, data: blob })
        });
        it('1 MiB', function(done) {
          var rw = new Worker('../rusha.min.js')
          var zero1M = new Int8Array(1024 * 1024);
          var blob = new Blob([zero1M]);
          rw.onmessage = function (e) {
            if (e.data.error) {
              throw e.data.error;
            }
            assert.strictEqual('3b71f43ff30f4b15b5cd85dd9e95ebc7e84eb5a3', e.data.hash);
            done();
          }
          rw.postMessage({ id: 0, data: blob })
        });
        it('1 GiB', function(done) {
          this.timeout(30 * 1000);
          var rw = new Worker('../rusha.min.js')
          var zero1M = new Int8Array(1024 * 1024);
          var blob = new Blob(Array(1024).fill(zero1M));
          rw.onmessage = function (e) {
            if (e.data.error) {
              throw e.data.error;
            }
            assert.strictEqual('2a492f15396a6768bcbca016993f4b4c8b0b5307', e.data.hash);
            done();
          }
          rw.postMessage({ id: 0, data: blob })
        });
        it('2 GiB', function(done) {
          this.timeout(60 * 1000);
          var rw = new Worker('../rusha.min.js')
          var zero1M = new Int8Array(1024 * 1024);
          var blob = new Blob(Array(2 * 1024).fill(zero1M));
          rw.onmessage = function (e) {
            if (e.data.error) {
              throw e.data.error;
            }
            assert.strictEqual('91d50642dd930e9542c39d36f0516d45f4e1af0d', e.data.hash);
            done();
          }
          rw.postMessage({ id: 0, data: blob })
        });
        it('1 kiB file', function(done) {
          var rw = new Worker('../rusha.min.js')
          var zero1k = new Int8Array(1024);
          var blob = new Blob([zero1k]);
          rw.onmessage = function (e) {
            if (e.data.error) {
              throw e.data.error;
            }
            assert.strictEqual('60cacbf3d72e1e7834203da608037b1bf83b40e8', e.data.hash);
            done();
          }
          rw.postMessage({ id: 0, file: blob })
        });
        it('1 MiB file', function(done) {
          var rw = new Worker('../rusha.min.js')
          var zero1M = new Int8Array(1024 * 1024);
          var blob = new Blob([zero1M]);
          rw.onmessage = function (e) {
            if (e.data.error) {
              throw e.data.error;
            }
            assert.strictEqual('3b71f43ff30f4b15b5cd85dd9e95ebc7e84eb5a3', e.data.hash);
            done();
          }
          rw.postMessage({ id: 0, file: blob })
        });
        it('1 GiB file', function(done) {
          this.timeout(30 * 1000);
          var rw = new Worker('../rusha.min.js')
          var zero1M = new Int8Array(1024 * 1024);
          var blob = new Blob(Array(1024).fill(zero1M));
          rw.onmessage = function (e) {
            if (e.data.error) {
              throw e.data.error;
            }
            assert.strictEqual('2a492f15396a6768bcbca016993f4b4c8b0b5307', e.data.hash);
            done();
          }
          rw.postMessage({ id: 0, file: blob })
        });
        it('2 GiB file', function(done) {
          this.timeout(60 * 1000);
          var rw = new Worker('../rusha.min.js')
          var zero1M = new Int8Array(1024 * 1024);
          var blob = new Blob(Array(2 * 1024).fill(zero1M));
          rw.onmessage = function (e) {
            if (e.data.error) {
              throw e.data.error;
            }
            assert.strictEqual('91d50642dd930e9542c39d36f0516d45f4e1af0d', e.data.hash);
            done();
          }
          rw.postMessage({ id: 0, file: blob })
        });
      });
    }

    describe('digestFromString', function() {
      it('returns hex string from string', function() {
        assert.strictEqual('a9993e364706816aba3e25717850c26c9cd0d89d', r.digestFromString(abcString));
      });
    });

    describe('digestFromBuffer', function() {
      it('returns hex string from buffer', function() {
        assert.strictEqual('a9993e364706816aba3e25717850c26c9cd0d89d', r.digestFromBuffer(abcBuffer));
      });
      it('returns hex string from array', function() {
        assert.strictEqual('a9993e364706816aba3e25717850c26c9cd0d89d', r.digestFromBuffer(abcArray));
      });
    });

    describe('digestFromArrayBuffer', function() {
      it('returns hex string from ArrayBuffer', function() {
        assert.strictEqual('a9993e364706816aba3e25717850c26c9cd0d89d', r.digestFromArrayBuffer(abcArrayBuffer));
      });
    });

    describe('rawDigest', function() {
      it('returns a sliced Int32Array', function() {
        assert.strictEqual(20, r.rawDigest(abcString).buffer.byteLength);
      });
      it('returns Int32Array from string', function() {
        assertBytesEqual(abcHashedInt32Array, r.rawDigest(abcString));
      });
      it('returns Int32Array from buffer', function() {
        assertBytesEqual(abcHashedInt32Array, r.rawDigest(abcBuffer));
      });
      it('returns Int32Array from array', function() {
        assertBytesEqual(abcHashedInt32Array, r.rawDigest(abcArray));
      });
      it('returns Int32Array from ArrayBuffer', function() {
        assertBytesEqual(abcHashedInt32Array, r.rawDigest(abcArrayBuffer));
      });
    });
  });
})();
