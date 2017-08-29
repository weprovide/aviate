const findUp = require('find-up')
const path = require('path')
module.exports = async () => {
  const configFile = await findUp('wepack.config.js')

  if(!configFile) {
    throw new Error('`wepack.config.js` not found')
  }

  const projectRoot = path.dirname(configFile)
  const outputPath = path.join(projectRoot, '.wepack')

  return {configFile, projectRoot, outputPath}
}