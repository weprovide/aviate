const formatMessages = require('webpack-format-messages')
const chalk = require('chalk')
const readline = require('readline')
const clearScreen = require('./clear-screen')

function getCompileTime(stats) {
  if (isMultiStats(stats)) {
    // Webpack multi compilations run in parallel so using the longest duration.
    // https://webpack.github.io/docs/configuration.html#multiple-configurations
    return stats.stats
      .reduce((time, stats) => Math.max(time, getCompileTime(stats)), 0)
  }
  return stats.endTime - stats.startTime
}

function isMultiStats(stats) {
  return stats.stats
}

function displayTook(stats) {
    const time = getCompileTime(stats)

    if(time > 1000) {
        return time / 1000 + 's'
    }

    return time + 'ms'
}

module.exports = (compiler) => {
    clearScreen()

    let first = true

    compiler.plugin('invalid', () => {
      clearScreen()
      console.log(chalk.yellow('Compiling...'))
    })

    compiler.plugin('done', (stats) => {
      if(first) {
        readline.cursorTo(process.stdout, 0, 1)
        readline.clearScreenDown(process.stdout)
      } else {
        readline.cursorTo(process.stdout, 0, 0)
        readline.clearScreenDown(process.stdout)
      }
      
      const messages = formatMessages(stats)

      if (!messages.errors.length && !messages.warnings.length) {
        // Don't clear `Starting server on HOST`
        console.log(`${chalk.green('Compiled successfully!')} ${chalk.dim(`in ${displayTook(stats)}`)}`)
      }

      if (messages.errors.length) {

        console.log(chalk.inverse('Failed to compile.'))
        messages.errors.forEach(e => console.log(e))
        return
      }

      if (messages.warnings.length) {

        console.log('Compiled with warnings.')
        messages.warnings.forEach(w => console.log(w))
      }

      first = false  
    })
}