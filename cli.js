#!/usr/bin/env node

const nodeVersion = require('node-version')

// Throw an error if node version is too low
if (nodeVersion.major < 8) {
  console.error('Error! wepack requires at least version 8 of Node. Please upgrade!')
  process.exit(1)
}

const run  = require('./lib/run')
run()
