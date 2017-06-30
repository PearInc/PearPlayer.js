// file:src/log-simple.js
var Log = console;
Log.setLogLevel = function(level) {};
// file:src/stream.js
var MP4BoxStream = function(arrayBuffer) {
  if (arrayBuffer instanceof ArrayBuffer) {
    this.buffer = arrayBuffer;
    this.uint8 = new Uint8Array(arrayBuffer);
  } else {
    throw ("Needs an array buffer");
  }
  this.position = 0;
};

/*************************************************************************
  Common API between MultiBufferStream and SimpleStream
 *************************************************************************/
MP4BoxStream.prototype.getPosition = function() {
  return this.position;
}

MP4BoxStream.prototype.getEndPosition = function() {
  return this.buffer.byteLength;
}

MP4BoxStream.prototype.getLength = function() {
  return this.buffer.byteLength;
}

MP4BoxStream.prototype.seek = function (pos) {
  var npos = Math.max(0, Math.min(this.uint8.length, pos));
  this.position = (isNaN(npos) || !isFinite(npos)) ? 0 : npos;
}

MP4BoxStream.prototype.isEos = function () {
  return this.getPosition() >= this.getEndPosition();
}

/*************************************************************************
  Read methods, simimar to DataStream but simpler
 *************************************************************************/

MP4BoxStream.prototype.readUint8 = function() {
  var u8;
  if (this.position + 1 <= this.uint8.length) {
    u8 = this.uint8[this.position];
    this.position++;
    return u8;
  } else {
    throw ("Not enough bytes in buffer");
  }
}

MP4BoxStream.prototype.readUint16 = function() {
  var u8_1, u8_2, u16;
  if (this.position + 2 <= this.uint8.length) {
    u8_1 = this.uint8[this.position];
    this.position++;
    u8_2 = this.uint8[this.position];
    this.position++;
    u16 = u8_1 << 8 | u8_2;
    return u16;
  } else {
    throw ("Not enough bytes in buffer");
  }
}

MP4BoxStream.prototype.readUint24 = function() {
  var u8, u24;
  if (this.position + 3 <= this.uint8.length) {
    u24 = this.uint8[this.position] << 16;
    this.position++;
    u24 |= this.uint8[this.position] << 8;
    this.position++;
    u24 |= this.uint8[this.position];
    this.position++;
    return u24;
  } else {
    throw ("Not enough bytes in buffer");
  }
}

MP4BoxStream.prototype.readUint32 = function() {
  var u8, u32;
  if (this.position + 4 <= this.uint8.length) {
    u32 = this.uint8[this.position] << 24;
    this.position++;
    u32 |= this.uint8[this.position] << 16;
    this.position++;
    u32 |= this.uint8[this.position] << 8;
    this.position++;
    u32 |= this.uint8[this.position];
    this.position++;
    return u32;
  } else {
    throw ("Not enough bytes in buffer");
  }
}

MP4BoxStream.prototype.readUint64 = function() {
  var u64;
  if (this.position + 8 <= this.uint8.length) {
    u64 = this.readUint32() << 32;
    u64 |= this.readUint32();
    return u64;
  } else {
    throw ("Not enough bytes in buffer");
  }
}

MP4BoxStream.prototype.readString = function(length) {
  if (this.position + length <= this.uint8.length) {
    var s = "";
    for (var i = 0; i < length; i++) {
      s += String.fromCharCode(this.readUint8());
    }
    return s;
  } else {
    throw ("Not enough bytes in buffer");
  }
}

MP4BoxStream.prototype.readCString = function() {
  var arr = [];
  while(true) {
    var b = this.readUint8();
    if (b !== 0) {
      arr.push(b);
    } else {
      break;
    }
  }
  return String.fromCharCode.apply(null, arr); 
}

MP4BoxStream.prototype.readInt8 = function() {
  return this.readUint8();
}

MP4BoxStream.prototype.readInt16 = function() {
  return this.readUint16();
}

MP4BoxStream.prototype.readInt32 = function() {
  return this.readUint32();
}

MP4BoxStream.prototype.readUint8Array = function(length) {
  var arr = [];
  for (var i = 0; i < length; i++) {
    arr[i] = this.readUint8();
  }
  return arr;
}

MP4BoxStream.prototype.readInt16Array = function(length) {
  var arr = [];
  for (var i = 0; i < length; i++) {
    arr[i] = this.readUint16();
  }
  return arr;
}

MP4BoxStream.prototype.readUint32Array = function(length) {
  var arr = [];
  for (var i = 0; i < length; i++) {
    arr[i] = this.readUint32();
  }
  return arr;
}

MP4BoxStream.prototype.readInt32Array = function(length) {
  var arr = [];
  for (var i = 0; i < length; i++) {
    arr[i] = this.readInt32();
  }
  return arr;
}
// file:src/box.js
/* 
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
var BoxParser = {
	ERR_NOT_ENOUGH_DATA : 0,
	OK : 1,
	boxCodes : [ 
				 "mdat", "idat", "free", "skip",
				 "avcC", "hvcC", "ftyp", "styp", 
				 "payl", "vttC",
				 "rtp ", "sdp ",
				 "btrt", "frma",
				 "trpy", "tpyl", "totl", "tpay", "dmed", "dimm", "drep", "nump", "npck", "maxr", "tmin", "tmax", "dmax", "pmax", "payt",
				 "vmhd", "smhd", "hmhd", // full boxes not yet parsed
				 "idat", "meco",
				 "udta", "strk",
				 "free", "skip"
			   ],
	fullBoxCodes : [ "mvhd", "tkhd", "mdhd", "hdlr", "vmhd", "smhd", "hmhd", "nmhd", "url ", "urn ", 
				  "ctts", "cslg", "stco", "co64", "stsc", "stss", "stsz", "stz2", "stts", "stsh", 
				  "mehd", "trex", "mfhd", "tfhd", "trun", "tfdt",
				  "esds", "subs",
				  "txtC",
				  "sidx", "emsg", "prft", "pssh",
				  "elst", "dref", "url ", "urn ",
				  "sbgp", "sgpd",
				  "cprt",
				  "iods",
				  "ssix", "tfra", "mfro", "pdin", "tsel",
				  "trep", "leva", "stri", "stsg",
				  "schm", 
				  "stvi", 
				  "padb", "stdp", "sdtp", "saio", "saiz",
				  "meta", "xml ", "bxml", "iloc", "pitm", "ipro", "iinf", "infe", "iref" , "mere", 
				  "kind", "elng",
				  /* missing "stsd", "iref", : special case full box and container */
				],
	containerBoxCodes : [ 
		[ "moov", [ "trak", "sidx" ] ],
		[ "trak" ],
		[ "edts" ],
		[ "mdia" ],
		[ "minf" ],
		[ "dinf" ],
		[ "stbl", [ "sgpd" ] ],
		[ "mvex", [ "trex" ] ],
		[ "moof", [ "traf" ] ],
		[ "traf", [ "trun" ] ],
		[ "vttc" ], 
		[ "tref" ],
		[ "iref" ],
		[ "udta" ],
		[ "mfra" ],
		[ "meco" ],
		[ "hnti" ],
		[ "hinf" ],
		[ "strk" ],
		[ "strd" ],
		[ "sinf" ],
		[ "rinf" ],
		[ "schi" ],
		[ "trgr" ],
		[ "udta", ["kind"] ],
		[ "iprp" ]
	],
	sampleEntryCodes : [ 
		/* 4CC as registered on http://mp4ra.org/codecs.html */
		{ prefix: "Visual", types: [ "mp4v", "avc1", "avc2", "avc3", "avc4", "avcp", "drac", "encv", "mjp2", "mvc1", "mvc2", "resv", "s263", "svc1", "vc-1", "hvc1", "hev1"  ] },
		{ prefix: "Audio", 	types: [ "mp4a", "ac-3", "alac", "dra1", "dtsc", "dtse", ,"dtsh", "dtsl", "ec-3", "enca", "g719", "g726", "m4ae", "mlpa",  "raw ", "samr", "sawb", "sawp", "sevc", "sqcp", "ssmv", "twos", ".mp3" ] },
		{ prefix: "Hint", 	types: [ "fdp ", "m2ts", "pm2t", "prtp", "rm2t", "rrtp", "rsrp", "rtp ", "sm2t", "srtp" ] },
		{ prefix: "Metadata", types: [ "metx", "mett", "urim" ] },
		{ prefix: "Subtitle", types: [ "stpp", "wvtt", "sbtt", "tx3g", "stxt" ] },
		{ prefix: "System", types: [ "mp4s"] }
	],
	sampleGroupEntryCodes: [
		"roll", "prol", "alst", "rap ", "tele", "avss", "avll", "sync", "tscl", "tsas", "stsa", "scif", "mvif", "scnm", "dtrt", "vipr", "tele", "rash"
	],
	trackGroupTypes: [ "msrc" ],
	initialize: function() {
		var i, j;
		var length;
		BoxParser.FullBox.prototype = new BoxParser.Box();
		BoxParser.ContainerBox.prototype = new BoxParser.Box();
		BoxParser.SampleEntry.prototype = new BoxParser.FullBox();
		BoxParser.TrackGroupTypeBox.prototype = new BoxParser.FullBox();
		/* creating constructors for simple boxes */
		length = BoxParser.boxCodes.length;
		for (i=0; i<length; i++) {
			BoxParser[BoxParser.boxCodes[i]+"Box"] = (function (j) { /* creating a closure around the iterating value of i */
				return function(size) {
					BoxParser.Box.call(this, BoxParser.boxCodes[j], size);
				}
			})(i);
			BoxParser[BoxParser.boxCodes[i]+"Box"].prototype = new BoxParser.Box();
		}
		/* creating constructors for full boxes */
		length = BoxParser.fullBoxCodes.length;
		for (i=0; i<length; i++) {
			BoxParser[BoxParser.fullBoxCodes[i]+"Box"] = (function (j) { 
				return function(size) {
					BoxParser.FullBox.call(this, BoxParser.fullBoxCodes[j], size);
				}
			})(i);
			BoxParser[BoxParser.fullBoxCodes[i]+"Box"].prototype = new BoxParser.FullBox();
		}
		/* creating constructors for container boxes */
		length = BoxParser.containerBoxCodes.length;
		for (i=0; i<length; i++) {
			BoxParser[BoxParser.containerBoxCodes[i][0]+"Box"] = (function (j, subBoxNames) { 
				return function(size) {
					BoxParser.ContainerBox.call(this, BoxParser.containerBoxCodes[j][0], size);
					if (subBoxNames) {
						this.subBoxNames = subBoxNames;
						var nbSubBoxes = subBoxNames.length;
						for (var k = 0; k<nbSubBoxes; k++) {
							this[subBoxNames[k]+"s"] = [];
						}
					}
				}
			})(i, BoxParser.containerBoxCodes[i][1]);
			BoxParser[BoxParser.containerBoxCodes[i][0]+"Box"].prototype = new BoxParser.ContainerBox();
		}
		/* creating constructors for stsd entries  */
		length = BoxParser.sampleEntryCodes.length;
		for (j = 0; j < length; j++) {
			var prefix = BoxParser.sampleEntryCodes[j].prefix;
			var types = BoxParser.sampleEntryCodes[j].types;
			var nb_types = types.length;
			BoxParser[prefix+"SampleEntry"] = function(type, size) { BoxParser.SampleEntry.call(this, type, size); };
			BoxParser[prefix+"SampleEntry"].prototype = new BoxParser.SampleEntry();
			for (i=0; i<nb_types; i++) {
				BoxParser[types[i]+"SampleEntry"] = (function (k, l) { 
					return function(size) {
						BoxParser[BoxParser.sampleEntryCodes[k].prefix+"SampleEntry"].call(this, BoxParser.sampleEntryCodes[k].types[l], size);
					}
				})(j, i);
				BoxParser[types[i]+"SampleEntry"].prototype = new BoxParser[prefix+"SampleEntry"]();
			}
		}
		/* creating constructors for stsd entries  */
		length = BoxParser.sampleGroupEntryCodes.length;
		for (i = 0; i < length; i++) {
			BoxParser[BoxParser.sampleGroupEntryCodes[i]+"SampleGroupEntry"] = (function (j) { 
				return function(size) {
					BoxParser.SampleGroupEntry.call(this, BoxParser.sampleGroupEntryCodes[j], size);
				}
			})(i);
			BoxParser[BoxParser.sampleGroupEntryCodes[i]+"SampleGroupEntry"].prototype = new BoxParser.SampleGroupEntry();
		}		
		/* creating constructors for track groups  */
		length = BoxParser.trackGroupTypes.length;
		for (i = 0; i < length; i++) {
			BoxParser[BoxParser.trackGroupTypes[i]+"Box"] = (function (j) { 
				return function(size) {
					BoxParser.TrackGroupTypeBox.call(this, BoxParser.trackGroupTypes[j], size);
				}
			})(i);
			BoxParser[BoxParser.trackGroupTypes[i]+"Box"].prototype = new BoxParser.TrackGroupTypeBox();
		}		
	},
	Box: function(_type, _size) {
		this.type = _type;
		this.size = _size;
	},
	FullBox: function(type, size) {
		BoxParser.Box.call(this, type, size);
		this.flags = 0;
		this.version = 0;
	},
	ContainerBox: function(type, size) {
		BoxParser.Box.call(this, type, size);
		this.boxes = [];
	},
	SampleEntry: function(type, size, hdr_size, start) {
		BoxParser.Box.call(this, type, size);	
		this.hdr_size = hdr_size;
		this.start = start;
		this.boxes = [];
	},
	SampleGroupEntry: function(type) {
		this.grouping_type = type;
	},
	TrackGroupTypeBox: function(type, size) {
		BoxParser.FullBox.call(this, type, size);
	}
}

BoxParser.initialize();

BoxParser.TKHD_FLAG_ENABLED    = 0x000001;
BoxParser.TKHD_FLAG_IN_MOVIE   = 0x000002;
BoxParser.TKHD_FLAG_IN_PREVIEW = 0x000004;

BoxParser.TFHD_FLAG_BASE_DATA_OFFSET	= 0x01;
BoxParser.TFHD_FLAG_SAMPLE_DESC			= 0x02;
BoxParser.TFHD_FLAG_SAMPLE_DUR			= 0x08;
BoxParser.TFHD_FLAG_SAMPLE_SIZE			= 0x10;
BoxParser.TFHD_FLAG_SAMPLE_FLAGS		= 0x20;
BoxParser.TFHD_FLAG_DUR_EMPTY			= 0x10000;
BoxParser.TFHD_FLAG_DEFAULT_BASE_IS_MOOF= 0x20000;

BoxParser.TRUN_FLAGS_DATA_OFFSET= 0x01;
BoxParser.TRUN_FLAGS_FIRST_FLAG	= 0x04;
BoxParser.TRUN_FLAGS_DURATION	= 0x100;
BoxParser.TRUN_FLAGS_SIZE		= 0x200;
BoxParser.TRUN_FLAGS_FLAGS		= 0x400;
BoxParser.TRUN_FLAGS_CTS_OFFSET	= 0x800;

if (typeof exports !== "undefined") {
	exports.BoxParser = BoxParser;
}
// file:src/box-parse.js
/* 
 * Copyright (c) Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
BoxParser.parseOneBox = function(stream, headerOnly) {
	var box;
	var start = stream.getPosition();
	var hdr_size = 0;
	var uuid;
	if (stream.getEndPosition() - start < 8) {
		Log.debug("BoxParser", "Not enough data in stream to parse the type and size of the box");
		return { code: BoxParser.ERR_NOT_ENOUGH_DATA };
	}
	var size = stream.readUint32();
	var type = stream.readString(4);
	Log.debug("BoxParser", "Found box of type "+type+" and size "+size+" at position "+start);
	hdr_size = 8;
	if (type == "uuid") {
		uuid = stream.readUint8Array(16);
		hdr_size += 16;
	}
	if (size == 1) {
		if (stream.getEndPosition() - stream.getPosition() < 8) {
			stream.seek(start);
			Log.warn("BoxParser", "Not enough data in stream to parse the extended size of the \""+type+"\" box");
			return { code: BoxParser.ERR_NOT_ENOUGH_DATA };
		}
		size = stream.readUint64();
		hdr_size += 8;
	} else if (size === 0) {
		/* box extends till the end of file */
		if (type !== "mdat") {
			throw "Unlimited box size not supported";
		}
	}
	
	if (start + size > stream.getEndPosition()) {
		stream.seek(start);
		Log.warn("BoxParser", "Not enough data in stream to parse the entire \""+type+"\" box");
		return { code: BoxParser.ERR_NOT_ENOUGH_DATA, type: type, size: size, hdr_size: hdr_size, start: start };
	}
	if (headerOnly) {
		return { code: BoxParser.OK, type: type, size: size, hdr_size: hdr_size, start: start };
	} else {
		if (BoxParser[type+"Box"]) {
			box = new BoxParser[type+"Box"](size);
		} else {
			if (type !== "uuid") {
				Log.warn("BoxParser", "Unknown box type: "+type);
			}
			box = new BoxParser.Box(type, size);
			if (uuid) {
				box.uuid = uuid;
			}
		}
	}
	box.hdr_size = hdr_size;
	/* recording the position of the box in the input stream */
	box.start = start;
	if (box.write === BoxParser.Box.prototype.write && box.type !== "mdat") {
		Log.warn("BoxParser", box.type+" box writing not yet implemented, keeping unparsed data in memory for later write");
		box.parseDataAndRewind(stream);
	}
	box.parse(stream);
	return { code: BoxParser.OK, box: box, size: size };
}

BoxParser.Box.prototype.parse = function(stream) {
	if (this.type != "mdat") {
		this.data = stream.readUint8Array(this.size-this.hdr_size);
	} else {
		if (this.size === 0) {
			stream.seek(stream.getEndPosition());
		} else {
			stream.seek(this.start+this.size);
		}
	}
}

/* Used to parse a box without consuming its data, to allow detailled parsing
   Useful for boxes for which a write method is not yet implemented */
BoxParser.Box.prototype.parseDataAndRewind = function(stream) {
	this.data = stream.readUint8Array(this.size-this.hdr_size);
	// rewinding
	stream.position -= this.size-this.hdr_size;
}

BoxParser.FullBox.prototype.parseDataAndRewind = function(stream) {
	this.parseFullHeader(stream);
	this.data = stream.readUint8Array(this.size-this.hdr_size);
	// restore the header size as if the full header had not been parsed
	this.hdr_size -= 4;
	// rewinding
	stream.position -= this.size-this.hdr_size;
}

BoxParser.FullBox.prototype.parseFullHeader = function (stream) {
	this.version = stream.readUint8();
	this.flags = stream.readUint24();
	this.hdr_size += 4;
}

BoxParser.FullBox.prototype.parse = function (stream) {
	this.parseFullHeader(stream);
	this.data = stream.readUint8Array(this.size-this.hdr_size);
}

BoxParser.ContainerBox.prototype.parse = function(stream) {
	var ret;
	var box;
	while (stream.getPosition() < this.start+this.size) {
		ret = BoxParser.parseOneBox(stream, false);
		box = ret.box;
		/* store the box in the 'boxes' array to preserve box order (for offset) but also store box in a property for more direct access */
		this.boxes.push(box);
		if (this.subBoxNames && this.subBoxNames.indexOf(box.type) != -1) {
			this[this.subBoxNames[this.subBoxNames.indexOf(box.type)]+"s"].push(box);
		} else {
			this[box.type] = box;
		}
	}
}

BoxParser.Box.prototype.parseLanguage = function(stream) {
	this.language = stream.readUint16();
	var chars = [];
	chars[0] = (this.language>>10)&0x1F;
	chars[1] = (this.language>>5)&0x1F;
	chars[2] = (this.language)&0x1F;
	this.languageString = String.fromCharCode(chars[0]+0x60, chars[1]+0x60, chars[2]+0x60);
}

// file:src/parsing/emsg.js
BoxParser.emsgBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.scheme_id_uri 				= stream.readCString();
	this.value 						= stream.readCString();
	this.timescale 					= stream.readUint32();
	this.presentation_time_delta 	= stream.readUint32();
	this.event_duration			 	= stream.readUint32();
	this.id 						= stream.readUint32();
	var message_size = this.size - this.hdr_size - (4*4 + (this.scheme_id_uri.length+1) + (this.value.length+1));
	this.message_data = stream.readUint8Array(message_size);
}

// file:src/parsing/styp.js
BoxParser.stypBox.prototype.parse = function(stream) {
	BoxParser.ftypBox.prototype.parse.call(this, stream);
}

// file:src/parsing/ftyp.js
BoxParser.ftypBox.prototype.parse = function(stream) {
	var toparse = this.size - this.hdr_size;
	this.major_brand = stream.readString(4);
	this.minor_version = stream.readUint32();
	toparse -= 8;
	this.compatible_brands = [];
	var i = 0;
	while (toparse>=4) {
		this.compatible_brands[i] = stream.readString(4);
		toparse -= 4;
		i++;
	}
}

// file:src/parsing/mdhd.js
BoxParser.mdhdBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	if (this.version == 1) {
		this.creation_time = stream.readUint64();
		this.modification_time = stream.readUint64();
		this.timescale = stream.readUint32();
		this.duration = stream.readUint64();
	} else {
		this.creation_time = stream.readUint32();
		this.modification_time = stream.readUint32();
		this.timescale = stream.readUint32();
		this.duration = stream.readUint32();
	}
	this.parseLanguage(stream);
	stream.readUint16();
}

// file:src/parsing/mfhd.js
BoxParser.mfhdBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.sequence_number = stream.readUint32();
}

// file:src/parsing/mvhd.js
BoxParser.mvhdBox.prototype.parse = function(stream) {
	this.flags = 0;
	this.parseFullHeader(stream);
	if (this.version == 1) {
		this.creation_time = stream.readUint64();
		this.modification_time = stream.readUint64();
		this.timescale = stream.readUint32();
		this.duration = stream.readUint64();
	} else {
		this.creation_time = stream.readUint32();
		this.modification_time = stream.readUint32();
		this.timescale = stream.readUint32();
		this.duration = stream.readUint32();
	}
	this.rate = stream.readUint32();
	this.volume = stream.readUint16()>>8;
	stream.readUint16();
	stream.readUint32Array(2);
	this.matrix = stream.readUint32Array(9);
	stream.readUint32Array(6);
	this.next_track_id = stream.readUint32();
}

// file:src/parsing/sidx.js
BoxParser.sidxBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.reference_ID = stream.readUint32();
	this.timescale = stream.readUint32();
	if (this.version === 0) {
		this.earliest_presentation_time = stream.readUint32();
		this.first_offset = stream.readUint32();
	} else {
		this.earliest_presentation_time = stream.readUint64();
		this.first_offset = stream.readUint64();
	}
	stream.readUint16();
	this.references = [];
	var count = stream.readUint16();
	for (var i = 0; i < count; i++) {
		var ref = {};
		this.references.push(ref);
		var tmp_32 = stream.readUint32();
		ref.reference_type = (tmp_32 >> 31) & 0x1;
		ref.referenced_size = tmp_32 & 0x7FFFFFFF;
		ref.subsegment_duration = stream.readUint32();
		tmp_32 = stream.readUint32();
		ref.starts_with_SAP = (tmp_32 >> 31) & 0x1;
		ref.SAP_type = (tmp_32 >> 28) & 0x7;
		ref.SAP_delta_time = tmp_32 & 0xFFFFFFF;
	}
}

// file:src/parsing/ssix.js
BoxParser.ssixBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.subsegments = [];
	var subsegment_count = stream.readUint32();
	for (var i = 0; i < subsegment_count; i++) {
		var subsegment = {};
		this.subsegments.push(subsegment);
		subsegment.ranges = [];
		var range_count = stream.readUint32();
		for (var j = 0; j < range_count; j++) {
			var range = {};
			subsegment.ranges.push(range);
			range.level = stream.readUint8();
			range.range_size = stream.readUint24();
		}
	}
}

// file:src/parsing/tkhd.js
BoxParser.tkhdBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	if (this.version == 1) {
		this.creation_time = stream.readUint64();
		this.modification_time = stream.readUint64();
		this.track_id = stream.readUint32();
		stream.readUint32();
		this.duration = stream.readUint64();
	} else {
		this.creation_time = stream.readUint32();
		this.modification_time = stream.readUint32();
		this.track_id = stream.readUint32();
		stream.readUint32();
		this.duration = stream.readUint32();
	}
	stream.readUint32Array(2);
	this.layer = stream.readInt16();
	this.alternate_group = stream.readInt16();
	this.volume = stream.readInt16()>>8;
	stream.readUint16();
	this.matrix = stream.readInt32Array(9);
	this.width = stream.readUint32();
	this.height = stream.readUint32();
}

// file:src/parsing/tfhd.js
BoxParser.tfhdBox.prototype.parse = function(stream) {
	var readBytes = 0;
	this.parseFullHeader(stream);
	this.track_id = stream.readUint32();
	if (this.size - this.hdr_size > readBytes && (this.flags & BoxParser.TFHD_FLAG_BASE_DATA_OFFSET)) {
		this.base_data_offset = stream.readUint64();
		readBytes += 8;
	} else {
		this.base_data_offset = 0;
	}
	if (this.size - this.hdr_size > readBytes && (this.flags & BoxParser.TFHD_FLAG_SAMPLE_DESC)) {
		this.default_sample_description_index = stream.readUint32();
		readBytes += 4;
	} else {
		this.default_sample_description_index = 0;
	}
	if (this.size - this.hdr_size > readBytes && (this.flags & BoxParser.TFHD_FLAG_SAMPLE_DUR)) {
		this.default_sample_duration = stream.readUint32();
		readBytes += 4;
	} else {
		this.default_sample_duration = 0;
	}
	if (this.size - this.hdr_size > readBytes && (this.flags & BoxParser.TFHD_FLAG_SAMPLE_SIZE)) {
		this.default_sample_size = stream.readUint32();
		readBytes += 4;
	} else {
		this.default_sample_size = 0;
	}
	if (this.size - this.hdr_size > readBytes && (this.flags & BoxParser.TFHD_FLAG_SAMPLE_FLAGS)) {
		this.default_sample_flags = stream.readUint32();
		readBytes += 4;
	} else {
		this.default_sample_flags = 0;
	}
}

// file:src/parsing/tfdt.js
BoxParser.tfdtBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	if (this.version == 1) {
		this.baseMediaDecodeTime = stream.readUint64();
	} else {
		this.baseMediaDecodeTime = stream.readUint32();
	}
}

// file:src/parsing/trun.js
BoxParser.trunBox.prototype.parse = function(stream) {
	var readBytes = 0;
	this.parseFullHeader(stream);
	this.sample_count = stream.readUint32();
	readBytes+= 4;
	if (this.size - this.hdr_size > readBytes && (this.flags & BoxParser.TRUN_FLAGS_DATA_OFFSET) ) {
		this.data_offset = stream.readInt32(); //signed
		readBytes += 4;
	} else {
		this.data_offset = 0;
	}
	if (this.size - this.hdr_size > readBytes && (this.flags & BoxParser.TRUN_FLAGS_FIRST_FLAG) ) {
		this.first_sample_flags = stream.readUint32();
		readBytes += 4;
	} else {
		this.first_sample_flags = 0;
	}
	this.sample_duration = [];
	this.sample_size = [];
	this.sample_flags = [];
	this.sample_composition_time_offset = [];
	if (this.size - this.hdr_size > readBytes) {
		for (var i = 0; i < this.sample_count; i++) {
			if (this.flags & BoxParser.TRUN_FLAGS_DURATION) {
				this.sample_duration[i] = stream.readUint32();
			}
			if (this.flags & BoxParser.TRUN_FLAGS_SIZE) {
				this.sample_size[i] = stream.readUint32();
			}
			if (this.flags & BoxParser.TRUN_FLAGS_FLAGS) {
				this.sample_flags[i] = stream.readUint32();
			}
			if (this.flags & BoxParser.TRUN_FLAGS_CTS_OFFSET) {
				if (this.version === 0) {
					this.sample_composition_time_offset[i] = stream.readUint32();
				} else {
					this.sample_composition_time_offset[i] = stream.readInt32(); //signed
				}
			}
		}
	}
}

// file:src/isofile.js
/* 
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
var ISOFile = function (stream) {
	/* MutiBufferStream object used to parse boxes */
	this.stream = stream;
	/* Array of all boxes (in order) found in the file */
	this.boxes = [];
	/* Array of all mdats */
	this.mdats = [];
	/* Array of all moofs */
	this.moofs = [];
	/* Boolean indicating if the file is compatible with progressive parsing (moov first) */
	this.isProgressive = false;
	/* Boolean used to fire moov start event only once */
	this.moovStartFound = false;
}

ISOFile.prototype.parse = function() {
	var found;
	var ret;
	var box;
	var parseBoxHeadersOnly = false;

	if (this.restoreParsePosition)	{
		if (!this.restoreParsePosition()) {
			return;
		}
	}

	while (true) {
		
		if (this.hasIncompleteMdat && this.hasIncompleteMdat()) {
			if (this.processIncompleteMdat()) {
				continue;
			} else {
				return;
			}
		} else {
			if (this.saveParsePosition)	{
				this.saveParsePosition();
			}
			ret = BoxParser.parseOneBox(this.stream, parseBoxHeadersOnly);
			if (ret.code === BoxParser.ERR_NOT_ENOUGH_DATA) {		
				if (this.processIncompleteBox) {
					if (this.processIncompleteBox(ret)) {
						continue;
					} else {
						return;
					}
				} else {
					return;
				}
			} else {
				/* the box is entirely parsed */
				box = ret.box;
				/* store the box in the 'boxes' array to preserve box order (for file rewrite if needed)  */
				this.boxes.push(box);
				/* but also store box in a property for more direct access */
				switch (box.type) {
					case "mdat":
						this.mdats.push(box);
						break;
					case "moof":
						this.moofs.push(box);
						break;
					case "moov":					
						this.moovStartFound = true;
						if (this.mdats.length === 0) {
							this.isProgressive = true;
						}
						/* no break */
						/* falls through */
					default:
						if (this[box.type] !== undefined) {
							Log.warn("ISOFile", "Duplicate Box of type: "+box.type+", overriding previous occurrence");
						}
						this[box.type] = box;
						break;
				}
				if (this.updateUsedBytes) {
					this.updateUsedBytes(box, ret);					
				}
			}
		}
	}
}

/* Find and return specific boxes using recursion and early return */
ISOFile.prototype.getBox = function(type) {
  var result = this.getBoxes(type, true);
  return (result.length ? result[0] : null);  
}

ISOFile.prototype.getBoxes = function(type, returnEarly) {
  var result = [];
  ISOFile._sweep.call(this, type, result, returnEarly);
  return result;
}

ISOFile._sweep = function(type, result, returnEarly) {
  if (this.type && this.type == type) result.push(this);
  for (var box in this.boxes) {
    if (result.length && returnEarly) return;
    ISOFile._sweep.call(this.boxes[box], type, result, returnEarly);
  }
}

if (typeof exports !== 'undefined') {
	exports.ISOFile = ISOFile;	
}
