// Core modules
const { writeFileSync } = require('fs')
const path = require('path')
const url = require('url')
const { promisify } = require('util')
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const SVGSpritemapPlugin = require('svg-spritemap-webpack-plugin')
const rimraf = promisify(require('rimraf'))
const mkdirp = promisify(require('mkdirp'))
const getConfig = require('../get-config')
const LogPlugin = require('./plugins/log')

module.exports = async function() {
  const env = process.env.NODE_ENV || 'development'
  const isDev = env === 'development'

  const { configFile, projectRoot, outputPath } = await getConfig()

  console.log(`Using config file: ${configFile}`)

  await rimraf(outputPath)
  await mkdirp(outputPath)

  let themeConfig = {}
  try {
    themeConfig = require(configFile)
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      console.error(err)
    }
  }

  let host = themeConfig.host || 'http://localhost:8080/'
  const parsedUrl = url.parse(host)
  host = url.format(parsedUrl)
  const port = parsedUrl.port || 8080
  const entry = {}
  const plugins = [
    new LogPlugin(),
    new webpack.DefinePlugin({
      'process.env': { NODE_ENV: JSON.stringify(env) }
    })
  ]

  writeFileSync(path.join(outputPath, 'host.txt'), host)

  let dockerUsed = false
  if (themeConfig.externalHost !== undefined) {
    writeFileSync(
        path.join(outputPath, 'externalHost.txt'),
        url.format(url.parse(themeConfig.externalHost))
    )
    dockerUsed = true;
  }

  if (typeof themeConfig.svgSprite === 'string') {
    plugins.push(
      new SVGSpritemapPlugin({
        src: themeConfig.svgSprite
      })
    )
  }

  if (typeof themeConfig.svgSprite === 'object') {
    plugins.push(new SVGSpritemapPlugin(themeConfig.svgSprite))
  }

  let publicPath = host
  if (isDev) {
    plugins.push(
      new webpack.NoEmitOnErrorsPlugin(),
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NamedModulesPlugin()
    )
    if (dockerUsed) {
      publicPath =  url.format(url.parse(themeConfig.externalHost));
    }

  } else {
    plugins.push(new UglifyJSPlugin())
  }

  const extractSass = new ExtractTextPlugin({
    filename: '[name].css'
  })

  let config = {
    context: projectRoot,
    entry,
    resolve: {
      modules: [path.join(__dirname, '../../node_modules'), 'node_modules']
    },
    resolveLoader: {
      modules: [
        path.join(__dirname, '../../node_modules'),
        'node_modules',
        path.join(__dirname, 'loaders')
      ]
    },
    output: {
      path: outputPath,
      filename: '[name].js',
      publicPath: isDev ? publicPath : '../'
    },
    devtool: isDev ? 'eval-source-map' : false,
    module: {
      rules: [
        {
          test: /\.scss$/,
          loader: [
            'extracted-loader',
            ...extractSass.extract({
              use: [
                {
                  loader: 'css-loader',
                  options: {
                    minimize: !isDev,
                    sourceMap: isDev
                  }
                },
                {
                  loader: 'postcss-loader',
                  options: {
                    sourceMap: isDev ? 'inline' : false,
                    plugins: loader => {
                      const defaultPlugins = (config = {}) =>
                        [
                          config.autoprefixer === false
                            ? null
                            : require('autoprefixer')({
                                browsers: ['last 2 versions', 'IE 11']
                              }),
                          config.lost === false ? null : require('lost'),
                          config['postcss-custom-media'] === false
                            ? null
                            : require('postcss-custom-media'),
                          config['postcss-zindex'] === false
                            ? null
                            : require('postcss-zindex'),
                          config['postcss-discard-duplicates'] === false
                            ? null
                            : require('postcss-discard-duplicates'),
                          config['postcss-unique-selectors'] === false
                            ? null
                            : require('postcss-unique-selectors'),
                          config['postcss-responsive-type'] === false
                            ? null
                            : require('postcss-responsive-type')
                        ].filter(i => i !== null)
                      // Allow custom PostCSS configuration
                      if (themeConfig.postCss) {
                        return themeConfig.postCss(loader, defaultPlugins)
                      }

                      return defaultPlugins()
                    }
                  }
                },
                {
                  loader: 'sass-loader',
                  options: {
                    sourceMap: isDev
                  }
                }
              ]
            })
          ]
        },
        {
          test: /\.(jpg|png|gif)$/,
          loader: 'file-loader',
          options: {
            name: 'images/[name].[ext]'
          }
        },
        {
          test: /\.svg$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: 'svg/[name].[ext]'
              }
            },
            {
              loader: 'svgo-loader',
              options: {
                plugins: [
                  { removeTitle: true },
                  { removeUselessDefs: false },
                  { convertPathData: false }
                ]
              }
            }
          ]
        },
        {
          test: /\.(ttf|woff2?|eot|otf)$/,
          loader: 'file-loader',
          options: {
            name: 'fonts/[name].[ext]'
          }
        },
        {
          test: /\.js$/,
          exclude: /(node_modules)/,
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              presets: [
                [
                  require.resolve('babel-preset-env'),
                  {
                    modules: false
                  }
                ],
                'react'
              ],
              plugins: [
                'react-require',
                'transform-object-rest-spread',
                'transform-class-properties',
                'transform-runtime',
                'styled-jsx/babel'
              ]
            }
          }
        }
      ]
    },
    plugins: [...plugins, extractSass],
    stats: {
      colors: true
    }
  }

  let devServer = {
    host: dockerUsed ? '0.0.0.0' : parsedUrl.hostname,
    port,
    https: parsedUrl.protocol === 'https:',
    contentBase: outputPath,
    compress: true,
    hot: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
    quiet: true,
    stats: {
      colors: true
    }
  }

  if (typeof themeConfig.decorateConfig === 'function') {
    config = await themeConfig.decorateConfig(config, {
      webpack,
      host,
      projectRoot
    })
  }

  if (typeof themeConfig.decorateDevConfig === 'function') {
    devServer = await themeConfig.decorateDevConfig(devServer, {
      webpack,
      host,
      projectRoot
    })
  }

  return [config, devServer]
}
