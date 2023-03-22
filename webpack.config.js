const path = require('path')


module.exports = {
  mode: 'development', // 开发模式
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  devtool: 'source-map', // 防止干扰源文件
}