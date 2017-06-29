# next-event

Call a function the next time a specific event is emitted

```
npm install next-event
```

[![build status](http://img.shields.io/travis/mafintosh/next-event.svg?style=flat)](http://travis-ci.org/mafintosh/next-event)

Basically like `.once` but faster.

## Usage

``` js
var nextEvent = require('next-event')

var ontest = nextEvent(emitter, 'test')

ontest(function () {
  console.log('i am only called once')
})

emitter.emit('test')
emitter.emit('test')
```

Note that only the last function you pass to `ontest` in the above example
will be called when the next event is emitted

``` js
ontest(function () {
  console.log('i am never called')
})

ontest(function () {
  console.log('i win because i was the last one')
})

emitter.test('test')
```

## API

#### `var once = nextEvent(emitter, name)`

Create a new once function. Pass an event handler to once
that should be called the next time `name` is emitted.

## License

MIT
