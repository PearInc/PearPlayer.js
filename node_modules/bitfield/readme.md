#bitfield

a very simple bitfield, compliant with the Bittorrent spec

    npm install bitfield

[![browser support](https://ci.testling.com/fb55/bitfield.png)](https://ci.testling.com/fb55/bitfield)

####Example

```js
var Bitfield = require("bitfield");

var field = new Bitfield(256); //create a bitfield with 256 bits

field.set(128); //set the 128th bit
field.set(128, true); //same as above

field.get(128); //true
field.get(200); //false (all values are initialised to `false`)
field.get(1e3); //false (out-of-bounds is also false)

field.set(128, false); //set the 128th bit to 0 again

field.buffer; //the buffer used by bitfield
```

####Methods
`Bitfield(data)`: `data` can be either a node.js buffer, WebGL Int8Array or numeric array, or a number representing the maximum number of supported bytes.

`Bitfield#get(index)`: Returns a boolean indicating whether the bit is set.

`Bitfield#set(index[, value])`: `value` defaults to true. Sets the bit to `1` for a value of `true` or `0` for `false`.

##### Auto-grow mode
`Bitfield(data, { grow: size })`: If you `set` an index that is out-of-bounds, the Bitfield will automatically grow so that the bitfield is big enough to contain the given index, up to the given `size` (in bit). If you want the Bitfield to grow indefinitely, pass `Infinity` as the size.


####Properties
`Bitfield#buffer`: The contents of the bitfield.

`Bitfield#grow`: The passed growth option (defaults to `0`).

##License

MIT
