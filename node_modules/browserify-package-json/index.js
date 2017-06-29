'use strict'
const stream = require('stream')

const isPackageJSONRegExp = /\b(?:package.json)$/
const isPackageJSON = (filename) => isPackageJSONRegExp.test(filename)

const arrify = (x) => Array.isArray(x) ? x : [x]

module.exports = function (filename, options) {
  if (!isPackageJSON(filename)) return new stream.PassThrough()

  let data = ''
  return new stream.Transform({
    transform (chunk, encoding, callback) {
      data += chunk.toString('utf8')
      callback(null)
    },

    flush (callback) {
      data = JSON.parse(data)

      let keys = Object.keys(data).filter((key) => !key.startsWith('_'))
      if (options && options.only !== undefined) keys = arrify(options.only)

      const result = {}
      for (let key of keys) result[key] = data[key]
      this.push(JSON.stringify(result, null, 2))

      callback(null)
    }
  })
}
