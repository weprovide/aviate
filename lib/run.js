const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const addDevServerEntrypoints = require('webpack-dev-server/lib/util/addDevServerEntrypoints')
const createDomain = require('webpack-dev-server/lib/util/createDomain')
const chalk = require('chalk')
const statTable = require('./stat-table')

const webpackConfig = require('./webpack/config')
const deployFiles = require('./deploy')

const [command] = process.argv.slice(2)

async function createWebpackConfig() {
  const [config, devServer] = await webpackConfig()
  if (process.env.NODE_ENV === 'development') {
    addDevServerEntrypoints(config, devServer)
  }
  const compiler = webpack(config)
  return { compiler, devServer }
}

async function dev() {
  try {
    const { compiler, devServer } = await createWebpackConfig()

    const server = new WebpackDevServer(compiler, devServer)
    server
      .listen(devServer.port, devServer.host, () => {
        console.log(chalk.green(`Started server on ${createDomain(devServer)}`))
        console.log(chalk.yellow('Compiling...'))
      })
      .on('error', err => {
        if (err.code === 'EADDRINUSE') {
          console.error(
            `${devServer.host}:${devServer.port} is already in use. You are most likely running another instance of Aviate.`
          )
          process.exit(0)
          return
        }

        console.error(err)
      })
  } catch (err) {
    console.error(err)
  }
}

async function build() {
  const { compiler } = await createWebpackConfig()
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        return reject(err)
      }

      resolve(stats)
    })
  })
}

module.exports = async function() {
  if (!command || command === 'dev') {
    process.env.NODE_ENV = process.env.NODE_ENV || 'development'
    return dev()
  }

  if (command === 'build') {
    process.env.NODE_ENV = process.env.NODE_ENV || 'production'
    try {
      console.log('Building project...')
      const stats = await build()
      statTable(stats)
      console.log('Copying files...')
      await deployFiles()
      console.log('Deployed files')
    } catch (err) {
      console.error(err.message)
    }
  }
}
