// 同步执行钩子
const { SyncHook } = require('tapable')
const fs = require('fs')
const path = require('path')

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

// 入口文件绝对路径解析

//将\替换成/
function toUnixPath(filePath) {
  return filePath.replace(/\\/g, "/");
}

const baseDir = toUnixPath(process.cmd())

class Compilation{
  constructor(webpackOptions) {
    this.options = webpack
    this.assets = [] // 本次编译产出的静态资源
    this.chunk = [] // 本次编译产出的代码块
    this.modules = [] // 本次编译产出的模块
    this.fileDependencies = [] // //本次打包涉及到的文件，这里主要是为了实现watch模式下监听文件的变化，文件发生变化后会重新编译
  }

  build(callback) {
    // 拿到入口, 这里
    let entry = {}
    if(typeof this.options.entry === 'string') {
      // 单入口
      entry.main = this.options.entry
    } else {
      // 多入口
      entry = this.options.entry
    }

    // 6. 从入口文件开始调用loader配置
    for(let entryName in entry) {

      let entryFilePath = path.posix.join(baseDir, entry[entryName])
      // 将入口文件添加进依赖数组
      this.fileDependencies.push(entryFilePath)
      // 得到入口模块的module对象
      let entryModule = this.buildModule(entryName, entryFilePath)

      // 将生成的入口文件module对象,放进this.modules中
      this.modules.push(entryModule)
    }

    // 编译成功够,执行回调函数
    callback()
  }

  // 编译模块,读取内容
  /**
   * 
   * @param {*} name  属于哪个chunk
   * @param {*} modulePath 模块绝对路径
   */
  buildModule(name, modulePath) {
    let sourceCode = fs.readFileSync(modulePath, 'utf8')
    // 创建模块对象, path.posix：允许在任意操作系统上使用linux的方式来操作路径。
    // relative获取相对路径 从baseDir 到modulePath的相对路径
    let moduleId = './' + path.posix.relative(baseDir, modulePath)

    let module = {
      id: moduleId,
      names: [name],  // 此模块肯呢个属于多个代码块
      dependencies: [], // 改module所依赖的模块
      _source: "",  // 该模块的代码信息
    }

    // 找到对应的loader,对源码进行转换
    let loaders = []
    let {rules = []} = this.options.module
    rules.forEach(rule => {
      let {test} = rule
      // 如果模块的路径和正则匹配,则把此规则对应的loader添加到loader数组中
      if(modulePath.match(test)) {
        loaders.push(...rule.use)
      }
    })

    // 自右向左对模块进行转译
    sourceCode = loaders.reduceRight((code, loader) => {
      return loader(code)
    }, sourceCode)

    return module
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

// 自定义loader

const loader1 = (source) => {
  return source + "// 给代码添加注释: loader1"
}

const loader2 = (source) => {
  return source + "// 给代码添加注释: loader2"
}



module.exports = {
  webpack,
  WebpackRunPlugin,
  WebpackDonePlugin,
  loader1,
  loader2
}