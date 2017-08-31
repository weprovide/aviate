const findUp = require('find-up')
const path = require('path')
module.exports = async () => {
  const configFile = await findUp('aviate.config.js')

  if(!configFile) {
    const wepackConfigFile = await findUp('wepack.config.js')
    if(wepackConfigFile) {
      throw new Error('`wepack.config.js` found. Please rename to `aviate.config.js`')      
    }
  }

  if(!configFile) {
    throw new Error('`aviate.config.js` not found')    
  }

  const projectRoot = path.dirname(configFile)
  const outputPath = path.join(projectRoot, '.aviate')

  return {configFile, projectRoot, outputPath}
}