// const { webpack } = require('webpack')
const { webpack } = require("./webpack") // 手写
const webpackOptions = require("./webpack.config.js")
const compiler = webpack(webpackOptions)

// 开始编译
compiler.run((err, stats) => {
  console.log(err)
  console.log(
    stats.toJson({
      assets: true, // 打印静态资源编译信息
      chunks: true, // 打印编译产出代码块
      modules: true, // 打印编译产出模块
    })
  )
})

/*
  1. 根据配置文件,找出入口文件
  2. 找到入口所依赖的模块,并收集起来,
  3. 根据上一步得到的信息, 生成最终到硬盘的文件,
    - loader
    - plugin
*/
