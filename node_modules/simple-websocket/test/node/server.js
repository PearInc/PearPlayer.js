var Socket = require('../../')
var Server = require('../../server')
var test = require('tape')

test('socket server', function (t) {
  t.plan(3)

  var port = 6789
  var server = new Server({ port: port })

  server.on('connection', function (socket) {
    t.equal(typeof socket.read, 'function') // stream function is present
    socket.on('data', function (data) {
      t.equal(data.toString(), 'ping')
      socket.write('pong')
    })
  })

  var client = new Socket('ws://localhost:' + port)
  client.on('data', function (data) {
    t.equal(data.toString(), 'pong')

    server.close()
    client.destroy()
  })
  client.write('ping')
})
