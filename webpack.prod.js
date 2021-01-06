const config = require('./webpack.config');

delete config.devtool;
delete config.devServer;
delete config.externals;
config.output.publicPath = 'build/';

module.exports = config;