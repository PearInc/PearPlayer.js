/*
index.js - Kademlia DHT K-bucket implementation as a binary tree.

The MIT License (MIT)

Copyright (c) 2013-2016 Tristan Slominski

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/
'use strict'

var bufferEquals = require('buffer-equals')
var randomBytes = require('randombytes')
var EventEmitter = require('events').EventEmitter
var inherits = require('inherits')

module.exports = KBucket

function createNode () {
  return { contacts: [], dontSplit: false, left: null, right: null }
}

/*
  * `options`:
    * `distance`: _Function_
        `function (firstId, secondId) { return distance }` An optional
        `distance` function that gets two `id` Buffers
        and return distance (as number) between them.
    * `arbiter`: _Function_ _(Default: vectorClock arbiter)_
        `function (incumbent, candidate) { return contact; }` An optional
        `arbiter` function that givent two `contact` objects with the same `id`
        returns the desired object to be used for updating the k-bucket. For
        more details, see [arbiter function](#arbiter-function).
    * `localNodeId`: _Buffer_ An optional Buffer representing the local node id.
        If not provided, a local node id will be created via
        `crypto.randomBytes(20)`.
    * `numberOfNodesPerKBucket`: _Integer_ _(Default: 20)_ The number of nodes
        that a k-bucket can contain before being full or split.
    * `numberOfNodesToPing`: _Integer_ _(Default: 3)_ The number of nodes to
        ping when a bucket that should not be split becomes full. KBucket will
        emit a `ping` event that contains `numberOfNodesToPing` nodes that have
        not been contacted the longest.
*/
function KBucket (options) {
  EventEmitter.call(this)
  options = options || {}

  this.localNodeId = options.localNodeId || randomBytes(20)
  if (!Buffer.isBuffer(this.localNodeId)) throw new TypeError('localNodeId is not a Buffer')
  this.numberOfNodesPerKBucket = options.numberOfNodesPerKBucket || 20
  this.numberOfNodesToPing = options.numberOfNodesToPing || 3
  this.distance = options.distance || KBucket.distance
  // use an arbiter from options or vectorClock arbiter by default
  this.arbiter = options.arbiter || KBucket.arbiter

  this.root = createNode()
}

inherits(KBucket, EventEmitter)

KBucket.arbiter = function (incumbent, candidate) {
  return incumbent.vectorClock > candidate.vectorClock ? incumbent : candidate
}

KBucket.distance = function (firstId, secondId) {
  var distance = 0
  var min = Math.min(firstId.length, secondId.length)
  var max = Math.max(firstId.length, secondId.length)
  for (var i = 0; i < min; ++i) distance = distance * 256 + (firstId[i] ^ secondId[i])
  for (; i < max; ++i) distance = distance * 256 + 255
  return distance
}

// contact: *required* the contact object to add
KBucket.prototype.add = function (contact) {
  if (!contact || !Buffer.isBuffer(contact.id)) throw new TypeError('contact.id is not a Buffer')
  var bitIndex = 0

  var node = this.root
  while (node.contacts === null) {
    // this is not a leaf node but an inner node with 'low' and 'high'
    // branches; we will check the appropriate bit of the identifier and
    // delegate to the appropriate node for further processing
    node = this._determineNode(node, contact.id, bitIndex++)
  }

  // check if the contact already exists
  var index = this._indexOf(node, contact.id)
  if (index >= 0) {
    this._update(node, index, contact)
    return this
  }

  if (node.contacts.length < this.numberOfNodesPerKBucket) {
    node.contacts.push(contact)
    this.emit('added', contact)
    return this
  }

  // the bucket is full
  if (node.dontSplit) {
    // we are not allowed to split the bucket
    // we need to ping the first this.numberOfNodesToPing
    // in order to determine if they are alive
    // only if one of the pinged nodes does not respond, can the new contact
    // be added (this prevents DoS flodding with new invalid contacts)
    this.emit('ping', node.contacts.slice(0, this.numberOfNodesToPing), contact)
    return this
  }

  this._split(node, bitIndex)
  return this.add(contact)
}

// id: Buffer *required* node id
// n: Integer (Default: Infinity) maximum number of closest contacts to return
// Return: Array of maximum of `n` closest contacts to the node id
KBucket.prototype.closest = function (id, n) {
  if (!Buffer.isBuffer(id)) throw new TypeError('id is not a Buffer')
  if (n === undefined) n = Infinity
  if (typeof n !== 'number' || isNaN(n) || n <= 0) throw new TypeError('n is not positive number')
  var contacts = []

  var self = this
  function sort (contacts) {
    return contacts.slice().sort(function (a, b) {
      return self.distance(a.id, id) - self.distance(b.id, id)
    })
  }

  for (var nodes = [ this.root ], bitIndex = 0; nodes.length > 0 && contacts.length < n;) {
    var node = nodes.pop()
    if (node.contacts === null) {
      var detNode = this._determineNode(node, id, bitIndex++)
      nodes.push(node.left === detNode ? node.right : node.left)
      nodes.push(detNode)
    } else {
      contacts = contacts.concat(sort(node.contacts)).slice(0, n)
    }
  }

  return contacts
}

// Counts the number of contacts recursively.
// If this is a leaf, just return the number of contacts contained. Otherwise,
// return the length of the high and low branches combined.
KBucket.prototype.count = function () {
  // return this.toArray().length
  var count = 0
  for (var nodes = [ this.root ]; nodes.length > 0;) {
    var node = nodes.pop()
    if (node.contacts === null) nodes.push(node.right, node.left)
    else count += node.contacts.length
  }
  return count
}

// Determines whether the id at the bitIndex is 0 or 1.
// Return left leaf if `id` at `bitIndex` is 0, right leaf otherwise
// node: internal object that has 2 leafs: left and right
// id: a Buffer to compare localNodeId with
// bitIndex: the bitIndex to which bit to check in the id Buffer
KBucket.prototype._determineNode = function (node, id, bitIndex) {
  // **NOTE** remember that id is a Buffer and has granularity of
  // bytes (8 bits), whereas the bitIndex is the _bit_ index (not byte)

  // id's that are too short are put in low bucket (1 byte = 8 bits)
  // parseInt(bitIndex / 8) finds how many bytes the bitIndex describes
  // bitIndex % 8 checks if we have extra bits beyond byte multiples
  // if number of bytes is <= no. of bytes described by bitIndex and there
  // are extra bits to consider, this means id has less bits than what
  // bitIndex describes, id therefore is too short, and will be put in low
  // bucket
  var bytesDescribedByBitIndex = ~~(bitIndex / 8)
  var bitIndexWithinByte = bitIndex % 8
  if ((id.length <= bytesDescribedByBitIndex) && (bitIndexWithinByte !== 0)) return node.left

  var byteUnderConsideration = id[bytesDescribedByBitIndex]

  // byteUnderConsideration is an integer from 0 to 255 represented by 8 bits
  // where 255 is 11111111 and 0 is 00000000
  // in order to find out whether the bit at bitIndexWithinByte is set
  // we construct Math.pow(2, (7 - bitIndexWithinByte)) which will consist
  // of all bits being 0, with only one bit set to 1
  // for example, if bitIndexWithinByte is 3, we will construct 00010000 by
  // Math.pow(2, (7 - 3)) -> Math.pow(2, 4) -> 16
  if (byteUnderConsideration & Math.pow(2, (7 - bitIndexWithinByte))) return node.right

  return node.left
}

// Get a contact by its exact ID.
// If this is a leaf, loop through the bucket contents and return the correct
// contact if we have it or null if not. If this is an inner node, determine
// which branch of the tree to traverse and repeat.
// id: Buffer *required* The ID of the contact to fetch.
KBucket.prototype.get = function (id) {
  if (!Buffer.isBuffer(id)) throw new TypeError('id is not a Buffer')
  var bitIndex = 0

  var node = this.root
  while (node.contacts === null) {
    node = this._determineNode(node, id, bitIndex++)
  }

  var index = this._indexOf(node, id) // index of uses contact id for matching
  return index >= 0 ? node.contacts[index] : null
}

// node: internal object that has 2 leafs: left and right
// id: Buffer Contact node id.
// Returns the index of the contact with the given id if it exists
KBucket.prototype._indexOf = function (node, id) {
  for (var i = 0; i < node.contacts.length; ++i) {
    if (bufferEquals(node.contacts[i].id, id)) return i
  }

  return -1
}

// id: Buffer *required* The ID of the contact to remove.
KBucket.prototype.remove = function (id) {
  if (!Buffer.isBuffer(id)) throw new TypeError('id is not a Buffer')
  var bitIndex = 0

  var node = this.root
  while (node.contacts === null) {
    node = this._determineNode(node, id, bitIndex++)
  }

  var index = this._indexOf(node, id)
  if (index >= 0) {
    var contact = node.contacts.splice(index, 1)[0]
    this.emit('removed', contact)
  }

  return this
}

// Splits the node, redistributes contacts to the new nodes, and marks the
// node that was split as an inner node of the binary tree of nodes by
// setting this.root.contacts = null
// node: *required* node for splitting
// bitIndex: *required* the bitIndex to which byte to check in the Buffer
//          for navigating the binary tree
KBucket.prototype._split = function (node, bitIndex) {
  node.left = createNode()
  node.right = createNode()

  // redistribute existing contacts amongst the two newly created nodes
  for (var i = 0; i < node.contacts.length; ++i) {
    var contact = node.contacts[i]
    this._determineNode(node, contact.id, bitIndex).contacts.push(contact)
  }
  node.contacts = null // mark as inner tree node

  // don't split the "far away" node
  // we check where the local node would end up and mark the other one as
  // "dontSplit" (i.e. "far away")
  var detNode = this._determineNode(node, this.localNodeId, bitIndex)
  var otherNode = node.left === detNode ? node.right : node.left
  otherNode.dontSplit = true
}

// Returns all the contacts contained in the tree as an array.
// If this is a leaf, return a copy of the bucket. `slice` is used so that we
// don't accidentally leak an internal reference out that might be accidentally
// misused. If this is not a leaf, return the union of the low and high
// branches (themselves also as arrays).
KBucket.prototype.toArray = function () {
  var result = []
  for (var nodes = [ this.root ]; nodes.length > 0;) {
    var node = nodes.pop()
    if (node.contacts === null) nodes.push(node.right, node.left)
    else result = result.concat(node.contacts)
  }
  return result
}

// Updates the contact selected by the arbiter.
// If the selection is our old contact and the candidate is some new contact
// then the new contact is abandoned (not added).
// If the selection is our old contact and the candidate is our old contact
// then we are refreshing the contact and it is marked as most recently
// contacted (by being moved to the right/end of the bucket array).
// If the selection is our new contact, the old contact is removed and the new
// contact is marked as most recently contacted.
// node: internal object that has 2 leafs: left and right
// contact: *required* the contact to update
// index: *required* the index in the bucket where contact exists
//        (index has already been computed in a previous calculation)
KBucket.prototype._update = function (node, index, contact) {
  // sanity check
  if (!bufferEquals(node.contacts[index].id, contact.id)) throw new Error('wrong index for _update')

  var incumbent = node.contacts[index]
  var selection = this.arbiter(incumbent, contact)
  // if the selection is our old contact and the candidate is some new
  // contact, then there is nothing to do
  if (selection === incumbent && incumbent !== contact) return

  node.contacts.splice(index, 1) // remove old contact
  node.contacts.push(selection) // add more recent contact version
  this.emit('updated', incumbent, selection)
}
