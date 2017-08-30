const Webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const addDevServerEntrypoints = require('webpack-dev-server/lib/util/addDevServerEntrypoints')
const createDomain = require('webpack-dev-server/lib/util/createDomain')
const chalk = require('chalk')

const webpackConfig = require('./webpack.config')
const logger = require('./logger')
const deployFiles = require('./deploy')

const [command] = process.argv.slice(2)

async function createWebpackConfig() {
  const [config, devServer] = await webpackConfig()
  if(process.env.NODE_ENV === 'development') {
    addDevServerEntrypoints(config, devServer)
  }
  const compiler = Webpack(config)
  return {compiler, config, devServer}
}

async function dev() {
  try {
    const {compiler, config, devServer} = await createWebpackConfig()
    logger(compiler)

    const server = new WebpackDevServer(compiler, devServer)
    server.listen(devServer.port, '127.0.0.1', () => {
      console.log(chalk.green(`Started server on ${createDomain(devServer)}`))
      console.log(chalk.yellow('Compiling...'))      
    }).on('error', (err) => {
      if(err.code === 'EADDRINUSE') {
        console.error(`Port ${devServer.port} is already in use`)
        process.exit(0)
      }
      
      console.error(err)
    })
  } catch (err) {
    console.error(err)
  }
}

async function build() {
  const {compiler, config, devServer} = await createWebpackConfig()
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if(err) {
        return reject(err)
      }

      resolve(stats)
    })
  })
}

module.exports = async function run() {
  if(!command || command === 'dev') {
    process.env.NODE_ENV = process.env.NODE_ENV || 'development'    
    return dev()
  }

  if(command === 'build') {
    process.env.NODE_ENV = process.env.NODE_ENV || 'production'    
    try {
      console.log('Building project...')
      await build()
      console.log('Copying files...')
      await deployFiles()
      console.log('Deployed files')
    } catch (err) {
      console.log(err)
    }
  }
}
