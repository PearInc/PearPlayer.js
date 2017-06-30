#!/usr/bin/env node
var createTorrent = require('../')
var fs = require('fs')
var minimist = require('minimist')

var argv = minimist(process.argv.slice(2), {
  alias: {
    o: 'outfile',
    n: 'name',
    h: 'help',
    v: 'version'
  },
  boolean: [
    'help',
    'version'
  ],
  string: [
    'outfile',
    'name',
    'creationDate',
    'comment',
    'createdBy',
    'announce',
    'urlList'
  ],
  default: {
    createdBy: 'WebTorrent <https://webtorrent.io>'
  }
})

var infile = argv._[0]
var outfile = argv.outfile

if (argv.version) {
  console.log(require('../package.json').version)
  process.exit(0)
}

if (!infile || argv.help) {
  console.log('usage: create-torrent <directory OR file> [OPTIONS]')
  console.log('')
  console.log('Create a torrent file from a directory or file.')
  console.log('')
  console.log('If an output file isn\'t specified with `-o`, the torrent file will be ')
  console.log('written to stdout.')
  console.log('')
  console.log('-o, --outfile    Output file. If not specified, stdout is used [string]')
  console.log('-n, --name       Torrent name [string]')
  console.log('--creationDate   Creation date [Date]')
  console.log('--comment        Torrent comment [string]')
  console.log('--createdBy      Created by client [string]')
  console.log('--private        Private torrent? [boolean] [default: false]')
  console.log('--pieceLength    Piece length [number] [default: reasonable length]')
  console.log('--announce       Tracker url [string] [default: reasonable trackers]')
  console.log('--urlList        Web seed url [string]')
  console.log('')
  process.exit(0)
}

createTorrent(infile, argv, function (err, torrent) {
  if (err) {
    console.error(err.stack)
    process.exit(1)
  } else if (outfile) {
    fs.writeFile(outfile, torrent, function (err) {
      if (err) {
        console.error(err.stack)
        process.exit(1)
      }
    })
  } else {
    process.stdout.write(torrent)
  }
})
