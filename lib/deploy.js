const { promisify } = require('util')
const path = require('path')
const copy = require('copy-dir')
const rimraf = require('rimraf')

const getConfig = require('./get-config')

// Filesystem
const rimrafAsync = promisify(rimraf)

const copyPromise = (source, dest) =>
  new Promise((resolve, reject) => {
    copy(source, dest, err => {
      if (err) {
        reject(err)
      }

      resolve()
    })
  })

module.exports = async () => {
  const { configFile, outputPath } = await getConfig()

  let themeConfig = {}
  try {
    themeConfig = require(configFile)
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      console.log(err)
    }
  }

  if (!themeConfig.distLocations) {
    console.error('No `distLocations` defined in theme config')
    process.exit(1)
    return
  }

  const copies = themeConfig.distLocations.map(async location => {
    console.log(location)
    // Make srue the dist location is clean
    await rimrafAsync(location)
    // Copy all files to dist location
    await copyPromise(outputPath, location)
    // Make sure we don't include host.txt
    await rimrafAsync(path.join(location, 'host.txt'))
  })

  try {
    await Promise.all(copies)
    console.log(`Copied to ${themeConfig.distLocations.join(' & ')} directory`)
  } catch (err) {
    console.error('Failed to copy dist directory')
    console.error(err)
  }
}
