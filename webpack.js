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

  compiler(onCompiled) {
    // 执行编译
    const compilation = new Compilation(this.option)
    
    compilation.build(onCompiled)

  }

  // 4. 执行compiler的run方法
  run(callback) {
    // call触发事件, 响应的在plugin中注册的事件都会执行
    this.hooks.run.call()
    const onCompiled = () => {
      // 编译完成触发的钩子
      this.hooks.done.call()
    }
    this.compiler(onCompiled) // 开始编译, 编译完成调用onCompiled
  }
}

class Compilation{
  constructor(webpackOptions) {
    this.options = webpack
    this.assets = [] // 本次编译产出的静态资源
    this.chunk = [] // 本次编译产出的代码块
    this.modules = [] // 本次编译产出的模块
    this.fileDependencies = [] // //本次打包涉及到的文件，这里主要是为了实现watch模式下监听文件的变化，文件发生变化后会重新编译
  }

  build(callback) {
    // ...
    
    // 编译成功够,执行回调函数
    callback()
  }
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
    // tap注册事件
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