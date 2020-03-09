// const BundleAnalyzerPlugin = require("webpack-bundle-analyzer")
//   .BundleAnalyzerPlugin;
// This will crash heroku build. to cancel:
// To view all builds:
// heroku builds -a YOUR_APP_NAME
// To cancel a specific (pending) build:
// heroku builds:cancel -a YOUR_APP_NAME HEROKU_BUILD_ID
//   configureWebpack: {
//   devtool: 'source-map',
//   plugins: [new BundleAnalyzerPlugin()]
// },
const WorkerPlugin = require('worker-plugin');

module.exports = {
  chainWebpack: config => {
    config.plugin('worker').use(WorkerPlugin);
  },
  publicPath: './',
  pwa: {
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      swSrc: 'src/service-worker.js',
    },
    name: 'Inter Planetary Flash Cards',
    themeColor: '#f8690d',
    backgroundColor: '#f8690d',
    msTileColor: '#f8690d',
    appleMobileWebAppCapable: 'yes',
    // appleMobileWebAppStatusBarStyle: 'black-translucent',
    manifestOptions: {
      start_url: './index.html',
      name: 'Inter Planetary Flash Cards',
      short_name: 'IPFC',
      theme_color: '#f8690d',
      display: 'standalone',
      icons: [
        {
          src: './img/icons/icon-72x72.png',
          sizes: '72x72',
          type: 'image/png',
        },
        {
          src: './img/icons/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png',
        },
        {
          src: './img/icons/icon-128x128.png',
          sizes: '128x128',
          type: 'image/png',
        },
        {
          src: './img/icons/icon-144x144.png',
          sizes: '144x144',
          type: 'image/png',
        },
        {
          src: './img/icons/icon-152x152.png',
          sizes: '152x152',
          type: 'image/png',
        },
        {
          src: './img/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: './img/icons/icon-384x384.png',
          sizes: '384x384',
          type: 'image/png',
        },
        {
          src: './img/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: './img/icons/maskable_icon.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    iconPaths: {
      favicon32: 'img/icons/icon-32x32.png',
      favicon16: 'img/icons/icon-16x16.png',
      appleTouchIcon: 'img/icons/icon-152x152.png',
      maskIcon: 'img/icons/icon-512x512.png',
      msTileImage: 'img/icons/maskable_icon.png',
    },
  },
};
