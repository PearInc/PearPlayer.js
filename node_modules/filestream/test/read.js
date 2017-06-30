var FileReadStream = require('../').read;
var test = require('tape');

test('read stream (3MB blob)', function(t) {
  testReadStream(t, 3 * 1000 * 1000);
});

test('read stream (30MB blob)', function(t) {
  testReadStream(t, 30 * 1000 * 1000);
});

test('read stream (300MB blob)', function(t) {
  testReadStream(t, 300 * 1000 * 1000);
});

function testReadStream(t, size) {
  t.plan(1);
  var data = new Buffer(size).fill('abc');
  var blob = new Blob([ data.buffer ]);

  var stream = new FileReadStream(blob);
  stream.on('error', function (err) {
    console.error(err);
    t.error(err.message);
  });

  var chunks = [];
  stream.on('data', function(chunk) {
    chunks.push(chunk);
  });

  stream.on('end', function() {
    var combined = Buffer.concat(chunks);
    t.deepEqual(combined, data);
  });
}
