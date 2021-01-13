const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");
const SRC = path.resolve(__dirname, 'src');
const isDev = process.env.NODE_ENV !== 'production';
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const config = module.exports = {
  entry: {
    index: './src/index.js'
  },
  output: {
    path: path.join(__dirname, 'build'),
    publicPath: '/',
    libraryTarget: 'var',
    library: 'ReactTask',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: SRC,
        use: [
          {loader: 'babel-loader', options: {babelrc: true}},
          {loader: "ifdef-loader", options: {
            GENERATE_MODE: process.env.GENERATE_MODE ? process.env.GENERATE_MODE : 'server',
          }},
        ]
      },
      {
        test: /\.css$/,
        use: [
          {loader: 'style-loader', options: {sourceMap: isDev}},
          {loader: 'css-loader', options: {modules: false}},
        ]
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'svg-url-loader',
            options: {
              limit: 10000,
            },
          },
        ],
      },
      {
        test: /.*\.(eot|ttf|woff(2)?)(\?v=\d+\.\d+\.\d+)?/,
        use: [{loader: 'file-loader', options: {name: 'fonts/[name].[ext]'}}]
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [{loader: 'url-loader'}],
      },
    ]
  },
  resolve: {
    extensions: ['.js'],
    alias: {
      '~': path.resolve(__dirname, 'assets'),
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        GENERATE_MODE: JSON.stringify(process.env.GENERATE_MODE),
      },
    }),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new CopyWebpackPlugin([
      {from: 'bebras-modules/', to: 'bebras-modules/'},
      {from: `index${'client' === process.env.GENERATE_MODE ? '.client' : (!isDev ? '.prod' : '')}.html`, to: 'index.html'}
    ]),
  ],
  externals: {
    /* TODO: clean this up by not having a dual browser/node module */
    fs: true,
    mime: true
  },
  devServer: {
    contentBase: path.join(__dirname, '/'),
    compress: true,
    port: 8080,
    hot: true
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendor",
          chunks: "all",
        },
        task: {
          test: /[\\/]server-modules[\\/]/,
          name: "task",
          chunks: "all",
          enforce: true,
        },
      },
    },
  },
};

// config.plugins.push(new BundleAnalyzerPlugin());

if (isDev) {
  config.devtool = 'inline-source-map';
} else {
  config.optimization.minimizer = [
    new TerserPlugin({
      terserOptions: {
        format: {
          comments: false,
        },
      },
      extractComments: false,
      exclude: /task/,
    }),
  ];
}
