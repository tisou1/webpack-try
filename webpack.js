// 同步执行钩子
const { SyncHook } = require('tapable')

// 编译class,单例模式
class Compiler {
  constructor(webpackOptions) {
    this.option = webpackOptions
    // 内部钩子
    this.hooks = {
      run: new SyncHook(),
      done: new SyncHook()
    }
  }


  run(callback) {}
}

// 1. 搭建结构
function webpack(webpackOptions){
  // 2.使用传入参数,初始化webpack的Compiler对象
  const compiler = new Compiler(webpackOptions)
  // 3. 挂载配置文件中的插件
  const { plugins } = webpackOptions
  for(let plugin of plugins) {
    plugin.apply(compiler)
  }

  return compiler
}


// plugin
//Webpack Plugin 其实就是一个普通的函数，在该函数中需要我们定制一个 apply 方法
// 当 Webpack 内部进行插件挂载时会执行 apply 函数

// 自定义插件, webpack运行时执行
class WebpackRunPlugin{
  apply(compiler){
    compiler.hooks.run.tap('WebpackRunPlugin', () => {
      console.log('开始编译')
    })
  }
}

// 自定义插件, webpacj运行完成时执行
class WebpackDonePlugin{
  applu(compiler){
    compiler.hooks.done.tap('WebpackDonePlugin', () => {
      console.log('完成编译')
    })
  }
}


module.exports = {
  webpack,
  WebpackRunPlugin,
  WebpackDonePlugin
}