/*!
 * bufferutil: WebSocket buffer utils
 * Copyright(c) 2015 Einar Otto Stangvik <einaros@gmail.com>
 * MIT Licensed
 */

#include <nan.h>

NAN_METHOD(mask) {
  char* from = node::Buffer::Data(info[0]);
  char* mask = node::Buffer::Data(info[1]);
  char* to = node::Buffer::Data(info[2]) + info[3]->Int32Value();
  size_t length = info[4]->Int32Value();
  size_t index = 0;

  //
  // Alignment preamble.
  //
  while (index < length && (reinterpret_cast<size_t>(from) & 0x07)) {
    *to++ = *from++ ^ mask[index % 4];
    index++;
  }
  length -= index;
  if (!length) return;

  //
  // Realign mask and convert to 64 bit.
  //
  char maskAlignedArray[8];

  for (size_t i = 0; i < 8; i++, index++) {
    maskAlignedArray[i] = mask[index % 4];
  }

  //
  // Apply 64 bit mask in 8 byte chunks.
  //
  size_t loop = length / 8;
  uint64_t* pMask8 = reinterpret_cast<uint64_t*>(maskAlignedArray);

  while (loop--) {
    uint64_t* pFrom8 = reinterpret_cast<uint64_t*>(from);
    uint64_t* pTo8 = reinterpret_cast<uint64_t*>(to);
    *pTo8 = *pFrom8 ^ *pMask8;
    from += 8;
    to += 8;
  }

  //
  // Apply mask to remaining data.
  //
  char* pmaskAlignedArray = maskAlignedArray;

  length &= 0x7;
  while (length--) {
    *to++ = *from++ ^ *pmaskAlignedArray++;
  }
}

NAN_METHOD(unmask) {
  char* from = node::Buffer::Data(info[0]);
  size_t length = node::Buffer::Length(info[0]);
  char* mask = node::Buffer::Data(info[1]);
  size_t index = 0;

  //
  // Alignment preamble.
  //
  while (index < length && (reinterpret_cast<size_t>(from) & 0x07)) {
    *from++ ^= mask[index % 4];
    index++;
  }
  length -= index;
  if (!length) return;

  //
  // Realign mask and convert to 64 bit.
  //
  char maskAlignedArray[8];

  for (size_t i = 0; i < 8; i++, index++) {
    maskAlignedArray[i] = mask[index % 4];
  }

  //
  // Apply 64 bit mask in 8 byte chunks.
  //
  size_t loop = length / 8;
  uint64_t* pMask8 = reinterpret_cast<uint64_t*>(maskAlignedArray);

  while (loop--) {
    uint64_t* pSource8 = reinterpret_cast<uint64_t*>(from);
    *pSource8 ^= *pMask8;
    from += 8;
  }

  //
  // Apply mask to remaining data.
  //
  char* pmaskAlignedArray = maskAlignedArray;

  length &= 0x7;
  while (length--) {
    *from++ ^= *pmaskAlignedArray++;
  }
}

NAN_MODULE_INIT(init) {
  NAN_EXPORT(target, mask);
  NAN_EXPORT(target, unmask);
}

NODE_MODULE(bufferutil, init)
