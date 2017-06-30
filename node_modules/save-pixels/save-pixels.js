"use strict"

var ContentStream = require("contentstream")
var GifEncoder = require("gif-encoder")
var jpegJs = require("jpeg-js")
var PNG = require("pngjs2").PNG
var through = require("through")

function handleData(array, data, frame) {
  var i, j, ptr = 0, c
  if(array.shape.length === 4) {
    for(j=0; j<array.shape[2]; ++j) {
      for(i=0; i<array.shape[1]; ++i) {
        data[ptr++] = array.get(frame,i,j,0)>>>0
        data[ptr++] = array.get(frame,i,j,1)>>>0
        data[ptr++] = array.get(frame,i,j,2)>>>0
        data[ptr++] = array.get(frame,i,j,3)>>>0
      }
    }
  } else if(array.shape.length === 3) {
    if(array.shape[2] === 3) {
      for(j=0; j<array.shape[1]; ++j) {
        for(i=0; i<array.shape[0]; ++i) {
          data[ptr++] = array.get(i,j,0)>>>0
          data[ptr++] = array.get(i,j,1)>>>0
          data[ptr++] = array.get(i,j,2)>>>0
          data[ptr++] = 255
        }
      }
    } else if(array.shape[2] === 4) {
      for(j=0; j<array.shape[1]; ++j) {
        for(i=0; i<array.shape[0]; ++i) {
          data[ptr++] = array.get(i,j,0)>>>0
          data[ptr++] = array.get(i,j,1)>>>0
          data[ptr++] = array.get(i,j,2)>>>0
          data[ptr++] = array.get(i,j,3)>>>0
        }
      }
    } else if(array.shape[3] === 1) {
      for(j=0; j<array.shape[1]; ++j) {
        for(i=0; i<array.shape[0]; ++i) {
          var c = array.get(i,j,0)>>>0
          data[ptr++] = c
          data[ptr++] = c
          data[ptr++] = c
          data[ptr++] = 255
        }
      }
    } else {
      return new Error("Incompatible array shape")
    }
  } else if(array.shape.length === 2) {
    for(j=0; j<array.shape[1]; ++j) {
      for(i=0; i<array.shape[0]; ++i) {
        var c = array.get(i,j,0)>>>0
        data[ptr++] = c
        data[ptr++] = c
        data[ptr++] = c
        data[ptr++] = 255
      }
    }
  } else {
    return new Error("Incompatible array shape")
  }
  return data
}

function haderror(err) {
  var result = through()
  result.emit("error", err)
  return result
}

module.exports = function savePixels(array, type) {
  switch(type.toUpperCase()) {
    case "JPG":
    case ".JPG":
    case "JPEG":
    case ".JPEG":
    case "JPE":
    case ".JPE":
      var width = array.shape[0]
      var height = array.shape[1]
      var data = new Buffer(width * height * 4)
      data = handleData(array, data)
      var rawImageData = {
        data: data,
        width: width,
        height: height
      }
      var jpegImageData = jpegJs.encode(rawImageData)
      return new ContentStream(jpegImageData.data)

    case "GIF":
    case ".GIF":
      var frames = array.shape.length === 4 ? array.shape[0] : 1
      var width = array.shape.length === 4 ? array.shape[1] : array.shape[0]
      var height = array.shape.length === 4 ? array.shape[2] : array.shape[1]
      var data = new Buffer(width * height * 4)
      var gif = new GifEncoder(width, height)
      gif.writeHeader()
      for (var i = 0; i < frames; i++) {
        data = handleData(array, data, i)
        gif.addFrame(data)
      }
      gif.finish()
      return gif

    case "PNG":
    case ".PNG":
      var png = new PNG({
        width: array.shape[0],
        height: array.shape[1]
      })
      var data = handleData(array, png.data)
      if (typeof data === "Error") return haderror(data)
      png.data = data
      return png.pack()

    case "CANVAS":
      var canvas = document.createElement("canvas")
      var context = canvas.getContext("2d")
      canvas.width = array.shape[0]
      canvas.height = array.shape[1]
      var imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      var data = imageData.data
      data = handleData(array, data)
      if (typeof data === "Error") return haderror(data)
      context.putImageData(imageData, 0, 0)
      return canvas
    
    default:
      return haderror(new Error("Unsupported file type: " + type))
  }
}
