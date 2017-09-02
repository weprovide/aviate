const bytes = require('bytes')
const Table = require('cli-table')

module.exports = stats => {
  const { assets } = stats.toJson()
  const table = new Table({ head: ['name', 'size'] })
  let totalSize = 0
  assets
    .sort((a, b) => {
      if (a.size === b.size) {
        return 0
      }

      return a.size > b.size ? 1 : -1
    })
    .forEach(asset => {
      totalSize += asset.size
      table.push([asset.name, bytes(asset.size)])
    })

  table.push(['Total', bytes(totalSize)])
  console.log(table.toString())
}
