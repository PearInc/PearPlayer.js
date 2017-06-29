# range-slice-stream

Extract a bunch of ranges from a stream to construct a new stream

## Usage

``` js
var RangeSliceStream = require('range-slice-stream')

var slicer = new RangeSliceStream()
slicer.end('abcdefghijklmnop')

var out = slicer.slice([
{
	start: 1,
	end: 3
},
{
	start: 6,
	end: 9
}
])

out.pipe(process.stdout)

// Prints 'bcghi'
```

## API

#### `var slicer = new RangeSliceStream([offset[, opts]])`

Create a new slicer, which is a writable stream.

If an `offset` is provided, it is subtracted from all range offsets. This
makes it more intuitive to use if the incoming data stream itself starts
at an offset into an underlying resource like a file.

`opts` is passed to the underlying writable stream constructor.

#### `var slice = slicer.slice([{start: <s1>, end: <e1>}, {start: <s2>, end: <e2>},...])`

Get a new readable stream that is built by concatenating the data from one
or more byte ranges of the data piped into the slicer. Like the `Buffer.slice()`
method, `start` is inclusive and `end` is exclusive.

`slice()` can be called multiple times to generate multiple streams built from
different sets of ranges. However, all ranges *must* be provided in increasing
order, both within a given call to `slice()` and between calls.

Data between ranges is discarded. Once all ranges specified by `slice()` calls
are satisfied, backpressure will be applied to the incoming stream until the
next desired range is specified by calling `slice()` again.

## License

MIT
