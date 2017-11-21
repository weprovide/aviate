# Aviate

Small WebPack based SCSS / Javascript compiler

## Installation

Install the package

```
npm install --save aviate
```

Open `package.json` and add:

```js
{
    "scripts": {
        "dev": "aviate",
        "build": "aviate build"
    }
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
    // Location to copy production assets to (usually one directory)
    distLocations: [
        path.join(__dirname, 'your/production/assets/directory')
    ],
    // Optional location of svgs to create a SVG sprite map. Can also be an object with configuration options for https://github.com/freshheads/svg-spritemap-webpack-plugin
    svgSprite: '**/*.svg',
    // Entirely optional if you don't have any custom postcss plugins
    // This example shows how to add css-mqpacker
    postCss(loader, defaultPlugins) {
        // Optional possibility to disable default postCSS plugins        
        const plugins = defaultPlugins({
            // 'autoprefixer': true,
            // 'lost': true,
            // 'postcss-custom-media': true,
            // 'postcss-zindex': true,
            // 'postcss-discard-duplicates': true,
            // 'postcss-unique-selectors': true,
            // 'postcss-responsive-type': true
        })

        plugins.push(require('css-mqpacker')())

        return plugins
    }
    // Allows you to define custom WebPack properties
    // `config` is a WebPack config object
    // `config.entry` is required
    decorateConfig(config) {
        config.entry = Object.assign({}, config.entry, {
            // When using scss that never changes (external dependencies) should be added to the array to greatly improve compilation time
            'styles': [
                path.join(__dirname, 'web/app/themes/wecustom/assets/styles/main.scss')
            ],
            // All javascript goes through Babel. So you can write es2015 (ES6) code. It also includes all requirements for compiling React applications
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
- [Font size responsive](https://github.com/seaneking/postcss-responsive-type) Allows you to easily create responsive types 
- [Lost Grid](http://lostgrid.org) Amazing grid system
- [Custom Media](https://github.com/postcss/postcss-custom-media) W3C compliant custom media queries
- [z-index](https://github.com/ben-eb/postcss-zindex) flattens z-index levels
- [Discard duplicates](https://github.com/ben-eb/postcss-discard-duplicates) removes properties that are always overwritten by the same selector at another location
- [Unique selectors](https://github.com/ben-eb/postcss-unique-selectors) deduplicates selectors
