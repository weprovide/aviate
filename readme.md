# Aviate

Small webpack based scss / javascript compiler

## Installation

Install the package

```
npm install --save aviate
```

Open `package.json` and add:

```
"scripts": {
    "dev": "aviate",
    "build": "aviate build"
}
```

Create the `aviate.config.js`

## Configuration file

Aviate is configured using the `aviate.config.js` file at the root of your project.

```js
const path = require('path')

module.exports = {
    // Defaults to http://localhost:9000 when not provided
    host: 'http://localhost:9000/',
    // Location to copy production assets to
    distLocations: [
        path.join(__dirname, 'your/production/assets/directory')
    ],
    // Entirely optional if you don't have any custom postcss plugins
    // This example shows how to add css-mqpacker
    // Default plugins are outlined below
    postCss(loader, defaultPlugins) {
        const defaultPlugins = defaultPlugins()
        defaultPlugins.push(require('css-mqpacker')())

        return defaultPlugins
    },
    // Allows you to define custom WebPack properties
    // `config` is a WebPack config object
    // `config.entry` is required
    decorateConfig(config) {
        config.entry = Object.assign({}, config.entry, {
            // When using scss that never changes (external dependencies) should be added to the array to greatly improve compilation time
            'styles': [
                path.join(__dirname, 'web/app/themes/wecustom/assets/styles/main.scss')
            ],
            // All javascript goes through Babel. So you can write es2015 (ES6) code. It also includes all requirements for compiling React
            'javascript': [
                path.join(__dirname, 'web/app/themes/wecustom/assets/javascript/main.js')
            ],
        })

        return config
    }
}
```

## PostCSS plugins

These plugins are included by default:

- [Autoprefixer](https://github.com/postcss/autoprefixer) (last 2 versions and Internet Explorer 11)
- [Lost Grid](http://lostgrid.org) Amazing grid system
- [Custom Media](https://github.com/postcss/postcss-custom-media) W3C compliant custom media queries
- [z-index](https://github.com/ben-eb/postcss-zindex) flattens z-index levels
- [Discard duplicates](https://github.com/ben-eb/postcss-discard-duplicates) removes properties that are always overwritten by the same selector at another location
- [Unique selectors](https://github.com/ben-eb/postcss-unique-selectors) deduplicates selectors
