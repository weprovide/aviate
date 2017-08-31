const { promisify } = require('util')
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
    await rimrafAsync(location)
    await copyPromise(outputPath, location)
  })

  try {
    await Promise.all(copies)
    console.log('Copied to dist directory')
  } catch (err) {
    console.error('Failed to copy dist directory')
    console.error(err)
  }
}
