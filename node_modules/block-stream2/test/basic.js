var test = require('tape')
  , BlockStream = require("../")

test("basic test", function (t) {
  var b = new BlockStream(16)
  var fs = require("fs")
  var fstr = fs.createReadStream(__filename, {encoding: "utf8"})
  fstr.pipe(b)
  b.resume();

  var stat
  t.doesNotThrow(function () {
    stat = fs.statSync(__filename)
  }, "stat should not throw")

  var totalBytes = 0
  b.on("data", function (c) {
    t.equal(c.length, 16, "chunks should be 16 bytes long")
    t.ok(Buffer.isBuffer(c), "chunks should be buffer objects")
    totalBytes += c.length
  })
  b.on("end", function () {
    var expectedBytes = stat.size + (16 - stat.size % 16)
    t.equal(totalBytes, expectedBytes, "Should be multiple of 16")
    t.end()
  })

})
