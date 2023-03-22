const path = require('path')
const { 
   WebpackRunPlugin,
   WebpackDonePlugin,
   loader1,
   loader2
 } = require('./webpack')


module.exports = {
  mode: 'development', // 开发模式
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  devtool: 'source-map', // 防止干扰源文件
  plugins: [
    new WebpackRunPlugin(),
    new WebpackDonePlugin()
  ],
  module: {
    rules: [
      {
        test: /\.js$/i,
        use: [loader1, loader2]
      }
    ]
}
}