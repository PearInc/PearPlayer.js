// Load in and combine all engine parts
var extend = require('obj-extend');
module.exports = extend({
  specVersion: '1.1.0'
}, require('./image'), require('./canvas'));
