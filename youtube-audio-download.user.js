// ==UserScript==
// @name           YouTube Audio Download
// @namespace      sooaweso.me
// @description    An add-on for YouTube Video Download that splits the audio from the video.
// @version        1.0
// @author         rossy
// @license        MIT License
// @grant          none
// @updateURL      https://github.com/rossy2401/youtube-audio-download/raw/master/youtube-audio-download.user.js
// @include        http://www.youtube.com/watch?*
// @include        https://www.youtube.com/watch?*
// @include        http://*.c.youtube.com/*
// @run-at         document-start
// ==/UserScript==

(function() {
 this.mp4js = {};
/**
 * mp4.js Copyright 2012 - Syu Kato <ukyo.web@gmail.com>
 * @version 0.2
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */
var mp4js = mp4js || {};
mp4js.version = "0.2";
/**
 * mp4.utils.js Copyright 2012 - Syu Kato <ukyo.web@gmail.com>
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */
(function(window){
var self = this;
/**
 * @param {Object} obj
 * @param {Object} type
 * @return {boolean}
 */
this.isType = function(obj, type){
 return obj != null ? obj.constructor == type : false;
};
/**
 * @param {string} url
 * @param {function} callback
 */
this.load = function(url, callback){
 var xhr = new XMLHttpRequest();
 xhr.open('GET', url);
 xhr.responseType = 'arraybuffer';
 xhr.onreadystatechange = function(){
  if(xhr.readyState == 4) {
   if(~~(xhr.status / 100) === 2 || xhr.status === 0) {
    callback.call(xhr, xhr.response);
   } else {
    throw 'Error: ' + xhr.status;
   }
  }
 };
 xhr.send();
};
/**
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @return {number}
 */
this.getUi16 = function(bytes, offset){
 return (bytes[offset] << 8) | (bytes[offset + 1]);
};
/**
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @return {number}
 */
this.getUi24 = function(bytes, offset){
 return (bytes[offset + 1] << 16) | (bytes[offset] << 8) | (bytes[offset + 1]);
};
/**
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @return {number}
 */
this.getUi32 = function(bytes, offset){
 return (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
};
/**
 * @param {Uint8Array} bytes
 * @param {number} len
 * @param {number} offset
 * @return {string}
 * 
 * ascii only!
 */
this.getStr = function(bytes, len, offset){
 var a = [];
 for(var i = 0; i < len; ++i) a[a.length] = bytes[offset + i];
 return String.fromCharCode.apply(null, a);
};
/**
 * @param {Uint8Array} bytes
 * @param {number} x
 * @param {number} offset
 */
this.putUi16 = function(bytes, x, offset){
 bytes[offset + 1] = x & 0xFF;
 bytes[offset] = x >> 8;
};
/**
 * @param {Uint8Array} bytes
 * @param {number} x
 * @param {number} offset
 */
this.putUi24 = function(bytes, x, offset){
 bytes[offset + 2] = x & 0xFF;
 bytes[offset + 1] = (x >> 8) & 0xFF;
 bytes[offset] = x >> 16;
};
/**
 * @param {Uint8Array} bytes
 * @param {number} x
 * @param {number} offset
 */
this.putUi32 = function(bytes, x, offset){
 bytes[offset + 3] = x & 0xFF;
 bytes[offset + 2] = (x >> 8) & 0xFF;
 bytes[offset + 1] = (x >> 16) & 0xFF;
 bytes[offset] = x >> 24;
};
/**
 * @param {Uint8Array} bytes
 * @param {string} s
 * @param {number} offset
 * 
 * ascii only!
 */
this.putStr = function(bytes, s, offset){
 for(var i = 0, n = s.length; i < n; ++i) bytes[i + offset] = s.charCodeAt(i);
};
/**
 * @param {...(Uint8Array|int8Array)} byteArrays
 * @return {Uint8Array}
 */
this.concatByteArrays = function(byteArrays){
 var byteArrays = self.isType(byteArrays, Array) ? byteArrays : Array.prototype.slice.call(arguments, 0),
  size = 0,
  offset = 0,
  i, n, ret;
 for(i = 0, n = byteArrays.length; i < n; ++i) size += byteArrays[i].length;
 ret = new Uint8Array(size);
 for(i = 0; i < n; ++i) {
  ret.set(byteArrays[i], offset);
  offset += byteArrays[i].length;
 }
 return ret;
};
}).call((function(mp4js){
 mp4js = mp4js || {};
 mp4js.utils = mp4js.utils || {};
 return mp4js.utils;
})(this.mp4js), this);
/**
 * Copyright 2012 - Syu Kato <ukyo.web@gmail.com>
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */
var mp4 = mp4 || {};
mp4.descr = mp4.descr || {};
(function(window, utils){
var self = this,
 putUi16 = utils.putUi16,
 putUi24 = utils.putUi24,
 putUi32 = utils.putUi32,
 putStr = utils.putStr,
 isType = utils.isType,
 concatByteArrays = utils.concatByteArrays;
/**
 * Create a base descriptor.
 * @param {number} size
 * @param {number} tag
 * @return {Uint8Array}
 */
this.createBaseDescriptor = function(size, tag){
 var descr = new Uint8Array(size + 2);
 descr[0] = tag;
 descr[1] = size;
 return descr;
};
/**
 * Create a ES_Descriptor.
 * @param {number} esId
 * @param {number} streamPriority
 * @param {number} dependsOnEsId
 * @param {string} url
 * @param {Uint8Array} decConfigDescr
 * @param {Uint8Array} slConfigDescr
 * @param {Array} subDescrs
 * @return {Uint8Array}
 */
this.createESDescriptor = function(esId, streamPriority, dependsOnEsId, url, decConfigDescr, slConfigDescr, subDescrs){
 var urlFlag = typeof url === "string" ? 1 : 0,
  streamDependenceFlag = dependsOnEsId != null ? 1 : 0,
  size = 3,
  offset = 2,
  descr, arr;
 subDescrs = subDescrs == null ? [] : isType(subDescrs, Array) ? subDescrs : [subDescrs];
 size += streamDependenceFlag ? 2 : 0;
 size += urlFlag ? (url.length + 1) : 0;
 size += decConfigDescr.length;
 size += slConfigDescr.length;
 arr = concatByteArrays(subDescrs);
 size += arr.length;
 descr = self.createBaseDescriptor(size, 0x03);
 putUi16(descr, esId, offset);
 offset += 2;
 descr[offset++] = (streamDependenceFlag << 7) | (urlFlag << 6) | streamPriority;
 if(streamDependenceFlag) {
  putUi16(descr, dependsOnEsId, offset);
  offset += 2;
 }
 if(urlFlag) {
  descr[offset++] = url.length;
  putStr(descr, url, offset);
  offset += url.length;
 }
 descr.set(decConfigDescr, offset);
 offset += decConfigDescr.length;
 descr.set(slConfigDescr, offset);
 offset += slConfigDescr.length;
 descr.set(arr, offset);
 return descr;
};
/**
 * Create a decode config descriptor.
 * @param {number} objectTypeIndication refer http://www.mp4ra.org/object.html
 * @param {number} streamType
 * @param {number} upStream
 * @param {number} bufferSizeDB max size of sample
 * @param {number} maxBitrate
 * @param {number} avgBitrate
 * @param {Array} subDescrs
 * @return {Uint8Array}
 */
this.createDecodeConfigDescriptor = function(objectTypeIndication, streamType, upStream, bufferSizeDB, maxBitrate, avgBitrate, subDescrs){
 var descr, arr;
 subDescrs = subDescrs == null ? [] : isType(subDescrs, Array) ? subDescrs : [subDescrs];
 arr = concatByteArrays(subDescrs);
 descr = self.createBaseDescriptor(arr.length + 13, 0x04);
 descr[2] = objectTypeIndication;
 descr[3] = (streamType << 2) | (upStream << 1) | 1;
 putUi24(descr, bufferSizeDB, 4);
 putUi32(descr, maxBitrate, 7);
 putUi32(descr, avgBitrate, 11);
 descr.set(arr, 15);
 return descr
};
/**
 * Create a decoder specific infomation.
 * @param {Uint8Array} arr
 * @return {Uint8Array}
 */
this.createDecoderSpecificInfo = function(arr){
 var descr = self.createBaseDescriptor(arr.length, 0x05);
 descr.set(arr, 2);
 return descr;
};
/**
 * Create a SL_ConfigDescriptor.
 * TODO mada tukuttenaiyo
 * @param {number} predefined
 * @return {Uint8Array}
 */
this.createSLConfigDescriptor = function(predefined){
 var descr = self.createBaseDescriptor(1, 0x06);
 descr[2] = predefined;
 return descr;
};
/**
 * @param {number} objectDescrId
 * @param {number} includeInlineProfileLevelFlag
 * @param {string} url
 * @param {number} odProfile
 * @param {number} sceneProfile
 * @param {number} audioProfile
 * @param {number} visualProfile
 * @param {number} graphicsProfile
 * @param {Array} subDescrs
 * @param {Array} extDescrs
 * @return {Uint8Array}
 */
this.createInitialObjectDescriptor = function(objectDescrId, includeInlineProfileLevelFlag, url, odProfile, sceneProfile, audioProfile, visualProfile, graphicsProfile, subDescrs, extDescrs){
 var urlFlag = typeof url === "string" ? 1 : 0,
  size = 2, offset = 4, descr, subArr, extArr;
 subDescrs = subDescrs == null ? [] : isType(subDescrs, Array) ? subDescr : [subDescr];
 extDescrs = extDescrs == null ? [] : isType(extDescrs, Array) ? extDescr : [extDescr];
 size += urlFlag ? url.length + 1 : 5;
 extArr = concatByteArrays(extDescrs);
 size += extArr.length;
 if(urlFlag) {
  descr = self.createBaseDescriptor(size, 0x10);
  descr[offset++] = url.length;
  putStr(descr, url, offset);
  offset += url.length;
 } else {
  subArr = concatByteArrays(subDescrs);
  size += subArr.length;
  descr = self.createBaseDescriptor(size, 0x10);
  descr[offset++] = odProfile;
  descr[offset++] = sceneProfile;
  descr[offset++] = audioProfile;
  descr[offset++] = visualProfile;
  descr[offset++] = graphicsProfile;
  descr.set(subArr, offset);
  offset += subArr.length;
 }
 putUi16(descr, (objectDescrId << 6) | (urlFlag << 5) | (includeInlineProfileLevelFlag << 4) | 0xF, 2);
 descr.set(extArr, offset);
 return descr;
};
}).call((function(mp4js){
 mp4js = mp4js || {};
 mp4js.descr = mp4js.descr || {};
 return mp4js.descr;
})(this.mp4js), this, this.mp4js.utils);
/**
 * mp4.box.js Copyright 2012 - Syu Kato <ukyo.web@gmail.com>
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */
(function(window, utils){
var self = this,
 putUi16 = utils.putUi16,
 putUi24 = utils.putUi24,
 putUi32 = utils.putUi32,
 putStr = utils.putStr,
 concatByteArrays = utils.concatByteArrays,
 isType = utils.isType;
/**
 * Create a box.
 * @param {number} size
 * @param {string} type
 * @return {Uint8Array}
 */
this.createBox = function(size, type){
 var box = new Uint8Array(size);
 putUi32(box, size, 0);
 putStr(box, type, 4);
 return box;
};
/**
 * Create a full box.
 * @param {number} size
 * @param {string} type
 * @param {number} version
 * @param {number} flags
 * @return {Uint8Array}
 */
this.createFullBox = function(size, type, version, flags){
 var box = self.createBox(size, type);
 putUi16(box, version, 8);
 putUi16(box, flags, 10);
 return box;
};
/**
 * Create a MPEG4AudioSampleDescriptionBox (mp4a).
 * 
 * aligned(8) class AudioSampleEntry(format) extends Atom('mp4a') {
 * 	uint(8)[6]  reserved = 0;
 *  uint(16)    data-reference-index;
 *  uint(32)[2] reserved = 0;
 *  uint(16)    reserved = 2;
 *  uint(16)    reserved = 16;
 *  uint(32)    reserved = 0;
 *  uint(16)    time-scale; //copied from the track
 *  uint(16)    reserved = 0;
 *  ESDAtom     ES;
 * }
 * 
 * @param {number} dataReferenceIndex
 * @param {number} timeScale
 * @param {Uint8Array} esdsBox
 * @return {Uint8Array}
 */
this.createMp4aBox = function(dataReferenceIndex, timeScale, esdsBox){
 var size = 36 + esdsBox.length,
  box = self.createBox(size, "mp4a");
 putUi16(box, dataReferenceIndex, 14);
 putUi16(box, 2, 24);
 putUi16(box, 16, 26);
 putUi16(box, timeScale, 32);
 box.set(esdsBox, 36);
 return box;
};
/**
 * Create a ESDescriptorBox (esds).
 * 
 * aligned(8) class ESDAtom extends FullAtom('esds', version = 0, 0) {
 * 	ES_Descriptor ES;
 * }
 * 
 * @param {Uint8Array} esDescr
 * @return {Uint8Array}
 * TODO
 */
this.createEsdsBox = function(esDescr){
 var box = self.createFullBox(12 + esDescr.length, "esds", 0, 0);
 box.set(esDescr, 12);
 return box;
};
/**
 * Create a TrackHeaderBox (tkhd).
 * 
 * aligned(8) class TrackHeaderAtom extends FullAtom('tkhd', version, flags) {
 * 	if (version == 1) {
 * 	 uint(64) creation-time;
 *   uint(64) modification-time;
 *   uint(32) track-ID;
 *   uint(32) reserved = 0;
 *   uint(64) duration;
 *  } else {
 * 	 uint(32) creation-time;
 *   uint(32) modification-time;
 *   uint(32) track-ID;
 *   uint(32) reserved = 0;
 *   uint(32) duration;
 *  }
 *  uint(32)[3] reserved = 0;
 *  bit(16)     reserved = { if track_is_audio 0x0100 else 0};
 *  uint(16)    reserved = 0;
 *  bit(32)[9]  reserved = { 0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000 };
 *  bit(32)     reserved = { if track_is_visual 0x01400000 else 0 };
 *  bit(32)     reserved = { if track_is_visual 0x00F00000 else 0 };
 * }
 * 
 * @param {number} creationTime
 * @param {number} modificationTime
 * @param {number} trackId
 * @param {number} duration
 * @param {boolean} isVisual
 * @return {Uint8Array}
 */
this.createTkhdBox = function(creationTime, modificationTime, trackId, duration, isVisual){
 var box = self.createFullBox(92, "tkhd", 0, 1);
 putUi32(box, creationTime, 12);
 putUi32(box, modificationTime, 16);
 putUi32(box, trackId, 20);
 putUi32(box, duration, 28);
 putUi16(box, !isVisual ? 0x0100 : 0, 44);
 putUi32(box, 0x00010000, 48);
 putUi32(box, 0x00010000, 64);
 putUi32(box, 0x40000000, 80);
 putUi32(box, isVisual ? 0x01400000 : 0, 84);
 putUi32(box, isVisual ? 0x00F00000 : 0, 88);
 return box;
};
/**
 * Create a MediaHeaderBox (mdhd).
 * 
 * aligned(8) class MediaHeaderAtom extends FullAtom('tkhd', version, 0) {
 * 	if (version == 1) {
 * 	 uint(64) creation-time;
 *   uint(64) modification-time;
 *   uint(32) timescale;
 *   uint(64) duration;
 *  } else {
 * 	 uint(32) creation-time;
 *   uint(32) modification-time;
 *   uint(32) timescale;
 *   uint(32) duration;
 *  }
 *  bit(1)      pad = 0;
 *  uint(5)[3]  language; // packed ISO-639-2/T language code
 *  uint(16)    reserved = 0;
 * }
 * 
 * @param {number} creationTime
 * @param {number} modificationTime
 * @param {number} timeScale
 * @param {number} duration
 * @return {Uint8Array}
 */
this.createMdhdBox = function(creationTime, modificationTime, timeScale, duration){
 var box = self.createFullBox(32, "mdhd", 0, 0);
 putUi32(box, creationTime, 12);
 putUi32(box, modificationTime, 16);
 putUi32(box, timeScale, 20);
 putUi32(box, duration, 24);
 putUi16(box, 0x55C4, 28);
 return box;
};
/**
 * Create a HandlerBox (hdlr).
 * 
 * aligned(8) class HandlerAtom extends FullAtom('hdlr', version, 0) {
 * 	uint(32)    reserved = 0;
 *  uint(32)    handler-type;
 *  uint(8)[12] reserved = 0;
 *  string      name;
 * }
 * 
 * @param {string} handlerType
 * @param {string} name
 * @return {Uint8Array}
 */
this.createHdlrBox = function(handlerType, name){
 var box = self.createFullBox(12 + 4 + 4 + 12 + name.length + 1, "hdlr", 0, 0);
 putStr(box, handlerType, 16);
 putStr(box, name, 32);
 return box;
};
/**
 * Concat boxes
 * @param {string} type
 * @param {...Uint8Array} boxes
 * @return {Uint8Array}
 */
this.concatBoxes = function(type, boxes){
 var boxes = Array.prototype.slice.call(arguments, 1),
  type = arguments[0],
  box, arr;
 arr = concatByteArrays(boxes);
 box = self.createBox(arr.length + 8, type);
 box.set(arr, 8);
 return box;
};
/**
 * Create a URLDataEntryBox (url ).
 * 
 * aligned(8) class DataEntryUrlAtom extends FullAtom('url ', version = 0, flags) {
 * 	string location;
 * }
 * 
 * @param {string} location
 * @param {number} flags
 * @return {Uint8Array}
 */
this.createUrlBox = function(location, flags){
 flags = typeof flags === "undefined" ? 1 : flags;
 var len = typeof location === "string" ? location.length + 1 : 0;
 var box = self.createFullBox(12 + len, "url ", 0, flags);
 len && putStr(box, location, 12);
 return box;
};
/**
 * Create a URNDataEntryBox (urn ).
 * 
 * aligned(8) class DataEntryUrnAtom extends FullAtom('urn ', version = 0, flags) {
 * 	string name;
 *  string location;
 * }
 * 
 * @param {string} name
 * @param {string} location
 * @param {number} flags
 * @return {Uint8Array}
 */
this.createUrnBox = function(name, location, flags){
 return createUrlBox(name + "\x00" + location, flags);
};
/**
 * Create a DataReferenceBox (dref).
 * 
 * aligned(8) class DataReferenceAtom extends FullAtom('dref', version = 0, 0) {
 * 	uint(32) entry-count;
 *  for (int i = 0; i < entry-countl i++) {
 * 	 DataEntryAtom(entry-version, entry-flags) data-entry;
 *  }
 * }
 * 
 * @param {...Uint8Array} dataEntries 
 * @return {Uint8Array}
 */
this.createDrefBox = function(dataEntries){
 var dataEntries = Array.prototype.slice.call(arguments, 0),
  box, arr;
 arr = concatByteArrays(dataEntries);
 box = self.createFullBox(arr.length + 16, "dref", 0, 0);
 putUi32(box, 12, dataEntries.length);
 box.set(arr, 16);
 return box;
};
/**
 * Create a SampleSizeBox (stsz).
 * 
 * aligned(8) class SampleSizeAtom extends FullAtom('stsz', version = 0, 0) {
 * 	uint(32) sample-size;
 *  uint(32) sample-count;
 *  for (int i = 0; i < sample-count; i++) {
 * 	 uint(32) entry-size;
 *  }
 * }
 * 
 * @param {number} sampleSize
 * @param {Array} sampleSizeArr
 * @return {Uint8Array}
 */
this.createStszBox = function(sampleSize, sampleSizeArr){
 var box = self.createFullBox(12 + 8 + (sampleSizeArr.length * 4), "stsz", 0, 0),
  i, n;
 putUi32(box, sampleSize, 12);
 putUi32(box, sampleSizeArr.length, 16);
 if(sampleSize === 0) {
  for(i = 0, n = sampleSizeArr.length; i < n; ++i) {
   putUi32(box, sampleSizeArr[i], i * 4 + 20);
  }
 }
 return box;
};
/**
 * Create a MovieHeaderBox (mvhd).
 * 
 * aligned(8) class MovieHeaderAtom extends FullAtom('mvhd', version, 0) {
 * 	if (version == 1) {
 * 	 uint(64) creation-time;
 *   uint(64) modification-time;
 *   uint(32) timescale;
 *   uint(64) duration;
 *  } else {
 * 	 uint(32) creation-time;
 *   uint(32) modification-time;
 *   uint(32) timescale;
 *   uint(32) duration;
 *  }
 *  bit(32)     reserved = 0x00010000;
 *  bit(16)     reserved = 0x0100;
 *  bit(16)     reserved = 0;
 *  uint(32)[2] reserved = 0;
 *  bit(32)[9]  reserved = { 0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000 };
 *  bit(32)[6]  reserved = 0;
 *  uint(32)    next-track-ID;
 * }
 * 
 * @param {number} creationTime
 * @param {number} modificationTime
 * @param {number} timeScale
 * @param {number} duration
 * @param {number} nextTrackId
 * @return {Uint8Array}
 */
this.createMvhdBox = function(creationTime, modificationTime, timeScale, duration, nextTrackId){
 var box = self.createFullBox(108, "mvhd", 0, 0);
 putUi32(box, creationTime, 12);
 putUi32(box, modificationTime, 16);
 putUi32(box, timeScale, 20);
 putUi32(box, duration, 24);
 putUi32(box, 0x00010000, 28);
 putUi16(box, 0x0100, 32);
 putUi32(box, 0x00010000, 44);
 putUi32(box, 0x00010000, 60);
 putUi32(box, 0x40000000, 76);
 putUi32(box, nextTrackId, 104);
 return box;
};
/**
 * Create a ObjectDescriptorBox (iods).
 * 
 * aligned(8) class ObjectDescriptorAtom extends FullAtom('iods', version = 0, 0) {
 * 	InitialObjectDescriptor OD;
 * }
 * 
 * @param {Uint8Array} initalObjectDescr
 * @return {Uint8Array}
 */
this.createIodsBox = function(initalObjectDescr){
 var box = self.createFullBox(initalObjectDescr.length + 12, "iods", 0, 0);
 box.set(initalObjectDescr, 12);
 return box;
};
/**
 * Create a data infomation box (dinf).
 * @param {...Uint8Array} args
 * @return {Uint8Array}
 */
this.createDinfBox = function(args){
 var args = Array.prototype.slice.call(arguments, 0),
  size = 16,
  offset = 16,
  i, n, dref, dinf;
 for(i = 0, n = args.length; i < n; ++i) size += args[i].length;
 dref = self.createFullBox(size, "dref", 0, 0);
 putUi32(dref, n, 12);
 for(i = 0; i < n; ++i) {
  dref.set(args[i], offset);
  offset += args[i].length;
 }
 dinf = self.createBox(size + 8, "dinf");
 dinf.set(dref, 8);
 return dinf;
};
/**
 * Create a sample description box (stsd).
 * 
 * aligned(8) class SampleDescriptionAtom extends FullAtom('stsd', version = 0, 0) {
 * 	uint(32) entry-count;
 *  for (int i = 0; i < entry-count; i++) {
 * 	 SampleEntry(entry-format) entry;
 *  }
 * }
 * 
 * @param {...Uint8Array} sampleEntries
 * @return {Uint8Array}
 */
this.createStsdBox = function(sampleEntries){
 var sampleEntries = Array.prototype.slice.call(arguments, 0),
  box, arr;
 arr = concatByteArrays(sampleEntries);
 box = self.createFullBox(arr.length + 16, "stsd", 0, 0);
 putUi32(box, sampleEntries.length, 12);
 box.set(arr, 16);
 return box;
};
/**
 * Create a TimeToSampleBox (stts).
 * 
 * aligned(8) class TimeToSampleBox extends FullAtom('stts', version = 0, 0) {
 * 	uint(32) entry-count;
 *  for (int i = 0; i < entry-count; i++) {
 * 	 uint(32) sample-count;
 *   int(32) sample-duration;
 *  }
 * }
 * 
 * @param {Array} entries
 * @return {Uint8Array}
 */
this.createSttsBox = function(entries){
 var size = 16 + entries.length * 8,
  box = self.createFullBox(size, "stts", 0, 0),
  offset = 16,
  i, n;
 putUi32(box, entries.length, 12);
 for(i = 0, n = entries.length; i < n; ++i) {
  putUi32(box, entries[i].count, offset);
  putUi32(box, entries[i].duration, offset + 4);
  offset += 8;
 }
 return box;
};
/**
 * Create a SampleToChunkBox (stsc).
 * 
 * aligned(8) class SampleToChunkAtom extends FullAtom('stsc', version = 0, 0) {
 * 	uint(32) entry-count;
 *  for (int i = 0; i < entry-count; i++) {
 * 	 uint(32) first-chunk;
 *   uint(32) samples-per-chunk;
 *   uint(32) samples-description-index;
 *  }
 * }
 * 
 * @param {Array.<Object>} chunks
 * @return {Uint8Array}
 */
this.createStscBox = function(chunks){
 chunks = isType(chunks, Array) ? chunks : [chunks];
 var n = chunks.length,
  box = self.createFullBox(12 + 4 + n * 12, "stsc", 0, 0),
  i, offset = 16;
 putUi32(box, n, 12);
 for(i = 0; i < n; ++i) {
  putUi32(box, chunks[i].firstChunk, offset); offset += 4;
  putUi32(box, chunks[i].samplesPerChunk, offset); offset += 4;
  putUi32(box, chunks[i].samplesDescriptionIndex, offset); offset += 4;
 }
 return box;
};
/**
 * Create a ChunkOffsetBox (stco).
 * 
 * aligned(8) class ChunkOffsetAtom extends FullAtom('stco', version = 0, 0) {
 * 	uint(32) entry-count;
 *  for (int i = 0; i < entry-count; i++) {
 * 	 uint(32) chunk-offset;
 *  }
 * }
 * 
 * @param {Array} chunkOffsets
 * @return {Uint8Array}
 */
this.createStcoBox = function(chunkOffsets){
 var n = chunkOffsets.length,
  box = self.createFullBox(16 + n * 4, "stco", 0, 0),
  i, j;
 putUi32(box, n, 12);
 for(i = 0; i < n; ++i) putUi32(box, chunkOffsets[i], i * 4 + 16);
 return box;
};
/**
 * Create a FreeSpaceBox (free).
 * 
 * aligned(8) class FreeSpaceAtom extends Atom(free-type) {
 * 	uint(8) data[];
 * }
 * 
 * @param {string} str
 * @return {Uint8Array}
 */
this.createFreeBox = function(str){
 var box = self.createBox(8 + str.length + 1, "free");
 putStr(box, str, 8);
 return box;
};
/**
 * Create a file type box (ftyp).
 * @param {string} main
 * @param {...string} other 
 * @return {Uint8Array}
 */
this.createFtypBox = function(main, other){
 var args = Array.prototype.slice.call(arguments, 0),
  box = self.createBox(args.length * 4 + 16, "ftyp"),
  offset = 16,
  i, n;
 putStr(box, main, 8);
 for(i = 0, n = args.length; i < n; ++i) {
  putStr(box, args[i], offset);
  offset += 4;
 }
 return box;
};
}).call((function(mp4js){
 mp4js = mp4js || {};
 mp4js.box = mp4js.box || {};
 return mp4js.box;
})(this.mp4js), this, this.mp4js.utils);
/**
 * mp4.main.js Copyright 2012 - Syu Kato <ukyo.web@gmail.com>
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */
(function(window){
var BlobBuilder = window.MozBlobBuilder || window.WebKitBlobBuilder || window.MSBlobBuilder || window.BlobBuilder,
 getUi16 = this.utils.getUi16,
 getUi24 = this.utils.getUi24,
 getUi32 = this.utils.getUi32,
 putUi16 = this.utils.putUi16,
 getStr = this.utils.getStr,
 isType = this.utils.isType,
 concatByteArrays = this.utils.concatByteArrays
 self = this,
 //see: http://www.mp4ra.org/atoms.html
 boxes = {
  ID32: getBox,
  albm: function(bytes, offset, size){},
  auth: function(bytes, offset, size){},
  bpcc: function(bytes, offset, size){},
  buff: function(bytes, offset, size){},
  bxml: getBox,
  ccid: function(bytes, offset, size){},
  cdef: function(bytes, offset, size){},
  clsf: function(bytes, offset, size){},
  cmap: function(bytes, offset, size){},
  co64: function(bytes, offset, size){},
  colr: function(bytes, offset, size){},
  cprt: function(bytes, offset, size){},
  crhd: function(bytes, offset, size){},
  cslg: function(bytes, offset, size){},
  ctts: function(bytes, offset, size){
   var ret = {size: size, body: []},
    i, n = getUi32(bytes, offset += 12);
   for(i = 0; i < n; ++i){
    ret.body.push({
     compositionOffset: getUi32(bytes, offset += 4),
     sampleCount: getUi32(bytes, offset += 4)
    })
   }
   return ret;
  },
  cvru: function(bytes, offset, size){},
  dcfD: function(bytes, offset, size){},
  dinf: getBox,
  dref: getBox,
  dscp: function(bytes, offset, size){},
  dsgd: getBox,
  dstg: getBox,
  edts: getBox,
  elst: function(bytes, offset, size){},
  feci: function(bytes, offset, size){},
  fecr: function(bytes, offset, size){},
  fiin: function(bytes, offset, size){},
  fire: function(bytes, offset, size){},
  fpar: function(bytes, offset, size){},
  free: function(bytes, offset, size){},
  frma: getBox,
  ftyp: function(bytes, offset, size){},
  gitn: function(bytes, offset, size){},
  gnre: function(bytes, offset, size){},
  grpi: function(bytes, offset, size){},
  hdlr: function(bytes, offset, size){
   return {
    size: size,
    type: getBoxType(bytes, offset + 16)
   }
  },
  hmhd: function(bytes, offset, size){},
  hpix: function(bytes, offset, size){},
  icnu: function(bytes, offset, size){},
  idat: function(bytes, offset, size){},
  ihdr: function(bytes, offset, size){},
  iinf: function(bytes, offset, size){},
  iloc: function(bytes, offset, size){},
  imif: getBox,
  infu: function(bytes, offset, size){},
  iods: getBox,
  iphd: function(bytes, offset, size){},
  ipmc: getBox,
  ipro: function(bytes, offset, size){},
  iref: function(bytes, offset, size){},
  'jp  ': function(bytes, offset, size){},
  jp2c: function(bytes, offset, size){},
  jp2h: function(bytes, offset, size){},
  jp2i: function(bytes, offset, size){},
  kywd: function(bytes, offset, size){},
  loci: function(bytes, offset, size){},
  lrcu: function(bytes, offset, size){},
  m7hd: function(bytes, offset, size){},
  mdat: function(bytes, offset, size){
   return {offset: offset, size: size, dataSize: size - 8};
  },
  mdhd: function(bytes, offset, size){
   return {
    size: size,
    creationTime: getUi32(bytes, offset + 12),
    modificationTime: getUi32(bytes, offset + 16),
    timeScale: getUi32(bytes, offset + 20),
    duration: getUi32(bytes, offset + 24),
    languageCode: getUi32(bytes, offset + 28)
   }
  },
  mdia: getBox,
  mdri: function(bytes, offset, size){},
  meco: getBox,
  mehd: getBox,
  mere: function(bytes, offset, size){},
  meta: getBox,
  mfhd: function(bytes, offset, size){},
  mfra: function(bytes, offset, size){},
  mfro: function(bytes, offset, size){},
  minf: getBox,
  mjhd: function(bytes, offset, size){},
  moof: function(bytes, offset, size){},
  moov: getBox,
  mvcg: function(bytes, offset, size){},
  mvci: function(bytes, offset, size){},
  mvex: getBox,
  mvhd: function(bytes, offset, size){
  },
  mvra: function(bytes, offset, size){},
  nmhd: function(bytes, offset, size){},
  ochd: function(bytes, offset, size){},
  odaf: function(bytes, offset, size){},
  odda: function(bytes, offset, size){},
  odhd: function(bytes, offset, size){},
  odhe: function(bytes, offset, size){},
  odrb: function(bytes, offset, size){},
  odrm: getBox,
  odtt: function(bytes, offset, size){},
  ohdr: function(bytes, offset, size){},
  padb: function(bytes, offset, size){},
  paen: function(bytes, offset, size){},
  pclr: function(bytes, offset, size){},
  pdin: function(bytes, offset, size){},
  perf: function(bytes, offset, size){},
  pitm: function(bytes, offset, size){},
  'res ': function(bytes, offset, size){},
  resc: function(bytes, offset, size){},
  resd: function(bytes, offset, size){},
  rtng: function(bytes, offset, size){},
  sbgp: getBox,
  schi: getBox,
  schm: getBox,
  sdep: function(bytes, offset, size){},
  sdhd: function(bytes, offset, size){},
  sdtp: getBox,
  sdvp: getBox,
  segr: function(bytes, offset, size){},
  sgpd: getBox,
  sidx: getBox,
  sinf: getBox,
  skip: function(bytes, offset, size){},
  smhd: function(bytes, offset, size){},
  srmb: function(bytes, offset, size){},
  srmc: getBox,
  srpp: function(bytes, offset, size){},
  stbl: getBox,
  stco: function(bytes, offset, size){
   var ret = {size: size, body: []},
    i, n = getUi32(bytes, offset += 12);
   for(i = 0; i < n; ++i){
    ret.body.push(getUi32(bytes, offset += 4));
   }
   return ret;
  },
  stdp: function(bytes, offset, size){},
  stsc: function(bytes, offset, size){
   var ret = {size: size, body: []},
    i, n = getUi32(bytes, offset += 12);
   for(i = 0; i < n; ++i){
    ret.body.push({
     firstChunk: getUi32(bytes, offset += 4),
     samplesPerChunk: getUi32(bytes, offset += 4),
     sampleDescriptionIndex: getUi32(bytes, offset += 4)
    })
   }
   return ret;
  },
  stsd: function(bytes, offset, size){
   return getBox(bytes, offset + 8, size - 8);
  },
  stsh: function(bytes, offset, size){},
  stss: function(bytes, offset, size){},
  stts: function(bytes, offset, size){
   return {
    size: size,
    entryCount: getUi32(bytes, offset + 12),
    sampleCount: getUi32(bytes, offset + 16),
    sampleDelta: getUi32(bytes, offset + 20)
   }
  },
  styp: getBox,
  stsz: function(bytes, offset, size){
   var ret = {size: size, body: []},
    i, n = getUi32(bytes, offset += 16);
   for(i = 0; i < n; ++i){
    ret.body.push(getUi32(bytes, offset += 4));
   }
   return ret;
  },
  stz2: function(bytes, offset, size){},
  subs: function(bytes, offset, size){},
  swtc: function(bytes, offset, size){},
  tfad: getBox,
  tfhd: function(bytes, offset, size){},
  tfma: getBox,
  tfra: function(bytes, offset, size){},
  tibr: function(bytes, offset, size){},
  tiri: function(bytes, offset, size){},
  titl: function(bytes, offset, size){},
  tkhd: function(bytes, offset, size){},
  traf: function(bytes, offset, size){},
  trak: getBox,
  tref: getBox,
  trex: function(bytes, offset, size){},
  trgr: function(bytes, offset, size){},
  trun: function(bytes, offset, size){},
  tsel: function(bytes, offset, size){},
  udta: getBox,
  uinf: function(bytes, offset, size){},
  UITS: function(bytes, offset, size){},
  ulst: function(bytes, offset, size){},
  'url ': function(bytes, offset, size){},
  vmhd: function(bytes, offset, size){},
  vwdi: function(bytes, offset, size){},
  'xml ': function(bytes, offset, size){},
  yrrc: function(bytes, offset, size){},
  //codecs
  mp4a: function(bytes, offset, size){
   return {
    dataReferenceIndex: getUi32(bytes, offset += 12),
    channels: getUi16(bytes, offset += 12),
    bitPerSample: getUi16(bytes, offset += 2),
    sampleRate: getUi32(bytes, offset += 4),
    esds: {
     objectTypeIndication: bytes[offset += 25],
     bufferSizeDB: getUi16(bytes, offset += 3),
     maxBitrate: getUi32(bytes, offset += 2),
     avgBitrate: getUi32(bytes, offset += 4)
    }
   }
  }
 },
 SAMPLERATE_TABLE = [
  96000,
  88200,
  64000,
  48000,
  44100,
  32000,
  24000,
  22050,
  16000,
  12000,
  11025,
  8000
 ];
/**
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @param {number} size
 * @return {Object}
 */
function getBox(bytes, offset, size){
 var ret = {size: size},
  last = offset + size,
  boxInfo, box;
 offset += 8;
 while(offset < last){
  boxInfo = getBoxInfo(bytes, offset);
  box = boxes[boxInfo.type];
  if(box) {
   if(ret[boxInfo.type] && !isType(ret[boxInfo.type], Array)){
    ret[boxInfo.type] = [ret[boxInfo.type]];
    ret[boxInfo.type].push(box(bytes, offset, boxInfo.size));
   } else if(isType(ret[boxInfo.type], Array)){
    ret[boxInfo.type].push(box(bytes, offset, boxInfo.size));
   } else {
    ret[boxInfo.type] = box(bytes, offset, boxInfo.size);
   }
  } else {
   break;
  }
  offset += boxInfo.size;
 }
 return ret;
}
/**
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @return {string}
 */
function getBoxType(bytes, offset){
 return getStr(bytes, 4, offset);
}
/**
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @return {Object}
 */
function getBoxInfo(bytes, offset){
 return {
  size: getUi32(bytes, offset),
  type: getBoxType(bytes, offset + 4)
 }
}
/**
 * Mp4 Parser
 * 
 * @constructor
 * @param {ArrayBuffer|Uint8Array} buffer
 */
this.Mp4 = function(buffer){
 this.bytes = isType(buffer, ArrayBuffer) ? new Uint8Array(buffer) : buffer;
 this.cache = {};
};
this.Mp4.prototype = {
 /**
	 * @return {Object}
	 */
 parse: function(){
  if(this.cache.tree) return this.cache.tree;
  return this.cache.tree = getBox(this.bytes, -8, this.bytes.length);
 },
 /**
	 * @return {ArrayBuffer}
	 */
 extractAACAsArrayBuffer: function(){
  var tree = this.parse(),
   tracks = tree.moov.trak,
   audioTrack, mp4a, sampleToChunkEntries, sampleSizeEntries, chunkEntries,
   i, j, k, n, m, l, fileSize, idx,result,
   resultOffset = 0,
   offset = 0,
   aacHeader = new Uint8Array(new ArrayBuffer(7));
  if(isType(tracks, Array)){
   tracks.forEach(function(track){
    if(track.mdia.hdlr.type === 'soun'){
     audioTrack = track;
    }
   });
  } else {
   if(tracks.mdia.hdlr.type === 'soun'){
    audioTrack = tracks;
   } else {
    throw 'This file does not have audio files.';
   }
  }
  mp4a = audioTrack.mdia.minf.stbl.stsd.mp4a;
  sampleToChunkEntries = audioTrack.mdia.minf.stbl.stsc.body;
  sampleSizeEntries = audioTrack.mdia.minf.stbl.stsz.body;
  chunkEntries = audioTrack.mdia.minf.stbl.stco.body;
  result = new Uint8Array(sampleSizeEntries.length * 7 + sampleSizeEntries.reduce(function(a, b){return a + b}));
  aacHeader[0] = 0xFF;
  aacHeader[1] = 0xF9;
  aacHeader[2] = 0x40 | (SAMPLERATE_TABLE.indexOf(mp4a.sampleRate) << 2) | (mp4a.channels >> 2);
  aacHeader[6] = 0xFC;
  for(i = 0, idx = 0, n = sampleToChunkEntries.length; i < n; ++i){
   j = sampleToChunkEntries[i].firstChunk - 1;
   m = i + 1 < n ? sampleToChunkEntries[i + 1].firstChunk - 1 : chunkEntries.length;
   for(;j < m; ++j){
    offset = chunkEntries[j];
    for(k = 0, l = sampleToChunkEntries[i].samplesPerChunk; k < l; ++k, ++idx){
     //AAC header.
     fileSize = sampleSizeEntries[idx] + 7;
     aacHeader[3] = (mp4a.channels << 6) | (fileSize >> 11);
     aacHeader[4] = fileSize >> 3;
     aacHeader[5] = (fileSize << 5) | (0x7ff >> 6);
     result.set(aacHeader, resultOffset);
     resultOffset += 7;
     result.set(this.bytes.subarray(offset, offset += sampleSizeEntries[idx]), resultOffset);
     resultOffset += sampleSizeEntries[idx];
    }
   }
  }
  return result.buffer;
 },
 extractAACAsBlob: function(){
  var bb = new BlobBuilder();
  bb.append(this.extractAACAsArrayBuffer());
  return bb.getBlob("audio/aac");
 }
};
/**
 * Convert a row aac file to a m4a file.
 * 
 * @param {ArrayBuffer} buffer
 * @return {ArrayBuffer}
 */
this.aacToM4a = function(buffer){
 var bytes = new Uint8Array(buffer),
  offset = 0,
  count = 0,
  sampleSizes = [],
  sampleOffsets = [],
  currentTime = Date.now(),
  dataSize, chunkIndex, samplesPerChunk,
  dataOffset, mdatOffset, stcoOffset,
  mp4a, slConfigDescr, decConfigDescr, esDescr, decSpecificInfo, arr,
  initialObjectDescr,
  esds, i, j,
  ftyp, stts, stsc, stsz, stco, stsd, stbl, dinf,
  smhd, minf, mdhd, hdlr, mdia, tkhd, iods, mdat,
  free, mvhd, trak,
  adts = {};
 function getFrameLength(offset) {
  return ((bytes[offset + 3] & 0x3) << 11) | (bytes[offset + 4] << 3) | (bytes[offset + 5] >> 5);
 }
 //aac header
 adts.id = (bytes[1] & 0x8) >> 3;
 adts.profile = bytes[2] >> 6;
 adts.sampleRate = SAMPLERATE_TABLE[(bytes[2] & 0x3C) >> 2];
 adts.channelConf = ((bytes[2] & 1) << 2) | (bytes[3] >> 6);
 adts.original = bytes[3] & 0x20;
 adts.bufferFullness = ((bytes[5] & 0x1F) << 6) | (bytes[6] >> 2);
 //count aac samples
 while(offset < bytes.length) {
  sampleOffsets[count] = offset;
  sampleSizes[count++] = getFrameLength(offset) - 7;//last number is aac header size.
  offset += getFrameLength(offset);
 }
 samplesPerChunk = count;
 initialObjectDescr = self.descr.createInitialObjectDescriptor(0x01, 0x00, null, 0xFF, 0xFF, 0x29, 0xFF, 0xFF);
 //aac header info?
 arr = new Uint8Array(2);
 putUi16(arr, 0x1000 | (SAMPLERATE_TABLE.indexOf(adts.sampleRate) << 7) | (adts.channelConf << 3), 0);
 decSpecificInfo = self.descr.createDecoderSpecificInfo(arr);
 decConfigDescr = self.descr.createDecodeConfigDescriptor(0x40, 0x05, 0, 0, 0, 0, [decSpecificInfo]);
 slConfigDescr = self.descr.createSLConfigDescriptor(2);
 esDescr = self.descr.createESDescriptor(0, 0, null, null, decConfigDescr, slConfigDescr, []);
 esds = self.box.createEsdsBox(esDescr);
 mp4a = self.box.createMp4aBox(1, adts.sampleRate, esds);
 ftyp = self.box.createFtypBox("M4A ", "isom", "mp42");
 stts = self.box.createSttsBox([{count: count, duration: 1024}]);
 stsc = self.box.createStscBox({firstChunk: 1, samplesPerChunk: samplesPerChunk, samplesDescriptionIndex: 1});
 stsz = self.box.createStszBox(0, sampleSizes);
 stsd = self.box.createStsdBox(mp4a);
 dinf = self.box.createDinfBox(self.box.createUrlBox(null, 1));
 smhd = self.box.createBox(16, "smhd");
 mdhd = self.box.createMdhdBox(currentTime, currentTime, adts.sampleRate, count * 1024);
 hdlr = self.box.createHdlrBox("soun", "mp4.js Audio Handler");
 tkhd = self.box.createTkhdBox(currentTime, currentTime, 1, ~~(count * 1024 * 600 / adts.sampleRate));
 iods = self.box.createIodsBox(initialObjectDescr);
 mvhd = self.box.createMvhdBox(currentTime, currentTime, 600, ~~(count * 1024 * 600 / adts.sampleRate), 2);
 dataSize = sampleSizes.reduce(function(a, b){return a + b});
 dataStart =
  ftyp.length + stts.length + stsc.length + stsz.length +
  stsd.length + dinf.length + smhd.length + mdhd.length +
  hdlr.length + tkhd.length + iods.length + mvhd.length;
 dataStart += 8 * 6;
 dataStart += (~~(sampleSizes.length / samplesPerChunk)) * 4 + 16;
 stco = self.box.createStcoBox([dataStart]);
 stbl = self.box.concatBoxes("stbl", stsd, stts, stsc, stsz, stco);
 minf = self.box.concatBoxes("minf", smhd, dinf, stbl);
 mdia = self.box.concatBoxes("mdia", mdhd, hdlr, minf);
 trak = self.box.concatBoxes("trak", tkhd, mdia);
 moov = self.box.concatBoxes("moov", mvhd, iods, trak);
 mdat = self.box.createBox(dataSize + 8, "mdat");
 dataOffset = 0;
 mdatOffset = 8;
 for(i = 0; i < count; ++i) {
  dataOffset = sampleOffsets[i];
  mdat.set(bytes.subarray(dataOffset + 7, dataOffset + 7 + sampleSizes[i]), mdatOffset);
  mdatOffset += sampleSizes[i];
 }
 free = self.box.createFreeBox("Produced with mp4.js " + self.version);
 return concatByteArrays(ftyp, moov, mdat, free).buffer;
};
}).call(this.mp4js, this);
}).call(window);
(function() {
 "use strict";
 function script(url) {
var blob, blobURL;
function sendMessage(type, data)
{
 window.parent.postMessage(JSON.stringify({ type: type, data: data }), "*");
}
function processMessage(type, data)
{
 switch (type)
 {
  case "ready-ack":
   get(url);
   break;
  case "revoke":
   blob = null;
   URL.revokeObjectURL(blobURL);
   break;
 }
}
window.addEventListener("message", function(e) {
 if (e.source != window.parent)
  return;
 var json = JSON.parse(e.data);
 processMessage(json.type, json.data);
}, false);
function process(data)
{
 var mp4 = new mp4js.Mp4(data), aac, m4a;
 data = null;
 try {
  aac = mp4.extractAACAsArrayBuffer();
 }
 catch (e) {
  sendMessage("error", { msg: "Error extracting AAC audio" });
  return;
 }
 mp4 = null;
 try {
  m4a = mp4js.aacToM4a(aac);
 }
 catch (e) {
  sendMessage("error", { msg: "Error creating M4A" });
  return;
 }
 blob = new Blob([m4a], { type: "audio/mp4" });
 blobURL = URL.createObjectURL(blob);
 sendMessage("finished", { blob: blobURL });
}
function get(url)
{
 var xhr = new XMLHttpRequest();
 xhr.open("GET", url, true);
 xhr.responseType = "arraybuffer";
 xhr.onload = function(e) {
  if (xhr.status == 200)
   process(xhr.response);
  else
   sendMessage("error", { msg: "Couldn't retrieve video, status code: " + xhr.status });
 };
 xhr.onprogress = function(e) {
  if (e.lengthComputable)
   sendMessage("progress", { loaded: e.loaded, total: e.total });
 };
 xhr.onerror = function(e) {
  sendMessage("error", { msg: "Couldn't retrieve video"});
 };
 xhr.send();
}
function main()
{
 sendMessage("ready");
}
  main();
 }
 if (/^https?:\/\/www.youtube.com\/watch?/.test(document.location.href))
  document.documentElement.setAttribute("data-ytd-audio-present", "data-ytd-audio-present");
 else
 {
  var m = document.location.href.match(/^(http:\/\/[^\/]+.c.youtube.com)\/#(.*)/);
  if (m)
  {
   document.replaceChild(document.createElement("html"), document.documentElement);
   document.documentElement.appendChild(document.createElement("body"));
   script(m[1] + m[2]);
  }
 }
})();
