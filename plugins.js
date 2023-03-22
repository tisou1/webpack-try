// 自定义插件, webpack运行时执行
class WebpackRunPlugin {
  apply(compiler) {
    // tap注册事件
    compiler.hooks.run.tap('WebpackRunPlugin', () => {
      console.log('开始编译')
    })
  }
}

// 自定义插件, webpacj运行完成时执行
class WebpackDonePlugin {
  apply(compiler) {
    compiler.hooks.done.tap('WebpackDonePlugin', () => {
      console.log('完成编译')
    })
  }
}

module.exports = {
  WebpackRunPlugin,
  WebpackDonePlugin,
}
