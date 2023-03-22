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


function webpack(webpackOptions){
  const compiler = new Compiler(webpackOptions)

  return compiler
}

module.exports = webpack