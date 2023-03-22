// 同步执行钩子
const fs = require('node:fs')
const path = require('node:path')
const { SyncHook } = require('tapable')

const parser = require('@babel/parser')
const types = require('@babel/types')
const traverse = require('@babel/traverse').default
const generator = require('@babel/generator').default
// 编译class,单例模式
class Compiler {
  constructor(webpackOptions) {
    this.option = webpackOptions
    // 内部钩子
    this.hooks = {
      run: new SyncHook(),
      done: new SyncHook(),
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
    const onCompiled = (err, stats, fileDependencies) => {
      // 10. 确定好输出内容后, 根据配置的输出路径和文件名,将文件写入到文件系统
      for (let filename in stats.assets) {
        let filePath = path.join(this.option.output.path, filename)
        fs.writeFileSync(filePath, stats.assets[filename], 'utf8')
      }
      callback(err, {
        toJson: () => stats
      }
    )
      // 编译完成触发的钩子
      this.hooks.done.call()
    }
    this.compiler(onCompiled) // 开始编译, 编译完成调用onCompiled
  }
}

// 入口文件绝对路径解析

// 将\替换成/
function toUnixPath(filePath) {
  return filePath.replace(/\\/g, '/')
}

const baseDir = toUnixPath(process.cwd())

// 获取文件路径
function tryExtensions(modulePath, extensions) {
  if (fs.existsSync(modulePath))
    return modulePath

  for (let i = 0; i < extensions.length; i++) {
    const filePath = modulePath + extensions[i]
    if (fs.existsSync(filePath))
      return filePath
  }

  throw new Error(`无法找到${modulePath}`)
}


//生成运行时代码
 function getSource(chunk) {
     return `
      (() => {
       var modules = {
         ${chunk.modules.map(
           (module) => `
           "${module.id}": (module) => {
             ${module._source}
           }
         `
         )}  
       };
       var cache = {};
       function require(moduleId) {
         var cachedModule = cache[moduleId];
         if (cachedModule !== undefined) {
           return cachedModule.exports;
         }
        var module = (cache[moduleId] = {
           exports: {},
        });
         modules[moduleId](module, module.exports, require);
         return module.exports;
      }
       var exports ={};
       ${chunk.entryModule._source}
     })();
      `;
   }
  


class Compilation {
  constructor(webpackOptions) {
    this.options = webpackOptions
    this.assets = [] // 本次编译产出的静态资源
    this.chunks = [] // 本次编译产出的代码块
    this.modules = [] // 本次编译产出的模块
    this.fileDependencies = [] // //本次打包涉及到的文件，这里主要是为了实现watch模式下监听文件的变化，文件发生变化后会重新编译
  }

  build(callback) {
    // 拿到入口, 这里
    let entry = {}
    if (typeof this.options.entry === 'string') {
      // 单入口
      entry.main = this.options.entry
    }
    else {
      // 多入口
      entry = this.options.entry
    }

    // 6. 从入口文件开始调用loader配置
    for (const entryName in entry) {
      const entryFilePath = path.posix.join(baseDir, entry[entryName])
      // 将入口文件添加进依赖数组
      this.fileDependencies.push(entryFilePath)
      // 得到入口模块的module对象
      const entryModule = this.buildModule(entryName, entryFilePath)

      // 将生成的入口文件module对象,放进this.modules中
      this.modules.push(entryModule)

      // 8. 等所有模块都编译完, 根据模块之间的依赖关系,组装代码块chunk
      // 一般来说一个入口文件对应一个chunk

      let chunk = {
        name: entryName,
        entryModule,
        modules: this.modules.filter(item => item.names.includes(entryName))
      }

      this.chunks.push(chunk)
    }

    this.chunks.forEach(chunk => {
      let filename = this.options.output.filename.replace('[name]', chunk.name)
      this.assets[filename] = getSource(chunk)
    })

    // 编译成功h后,执行回调函数
    callback(
      null,
      {
        chunks: this.chunks,
        modules: this.modules,
        assets: this.assets
      },
      this.fileDependencies
    )
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
    const moduleId = `./${path.posix.relative(baseDir, modulePath)}`

    const module = {
      id: moduleId,
      names: [name], // 此模块肯呢个属于多个代码块
      dependencies: [], // 改module所依赖的模块
      _source: '', // 该模块的代码信息
    }

    // 找到对应的loader,对源码进行转换
    const loaders = []
    const { rules = [] } = this.options.module
    rules.forEach((rule) => {
      const { test } = rule
      // 如果模块的路径和正则匹配,则把此规则对应的loader添加到loader数组中
      if (modulePath.match(test))
        loaders.push(...rule.use)
    })

    // 自右向左对模块进行转译
    sourceCode = loaders.reduceRight((code, loader) => {
      return loader(code)
    }, sourceCode)

    // 7. 找出此模块所依赖的模块, 在对模块进行编译
    // 把源代码转换为ast

    const ast = parser.parse(sourceCode, { sourceType: 'module' })
    traverse(ast, {
      CallExpression: (nodePath) => {
        const { node } = nodePath
        // 在ast中查找require语句
        if (node.callee.name === 'require') {
          // 获取依赖模块
          const depModuleName = node.arguments[0].value
          const dirname = path.posix.dirname(modulePath) // 获取当前正在编译模块所在目录
          let depModulePath = path.posix.join(dirname, depModuleName) // 获取模块的绝对路径
          const extensions = this.options.resolve?.extensions || ['.js'] // 获取配置中的extensions
          depModulePath = tryExtensions(depModulePath, extensions)
          // 将依赖模块的绝对路径push到依数组中
          this.fileDependencies.push(depModulePath)
          // 生成依赖模块的模块id
          let depModuleId = './' + path.posix.relative(baseDir, depModulePath)
          // 修改语法结构, 把依赖的模块改为依赖模块id, require("./name") => require("./src/name.js")
          node.arguments = [types.stringLiteral(depModuleId)]
          // 将依赖模块信息push到该模块的dependencied属性中
          module.dependencies.push({ depModuleId, depModulePath })
        }
      },
    })

    // 生成新的代码, 并把转义后的源代码放到module._source上
    let { code } = generator(ast)
    module._source = code

    // 对依赖模块进行编译, 也就是说要递归的对module对象中的dependeccies进行
    module.dependencies.forEach(({depModuleId, depModulePath}) => {
      let existModule = this.modules.find(item => item.id === depModuleId)
      // 如果modules中已经存在将要编译的模块,那么就不需要在进行编译

      if (existModule) {
        // names指代该模块属于那个代码块chunk
        existModule.names.push(name)
      } else {
        let depModule = this.buildModule(name, depModulePath)
        this.modules.push(depModule)
      }
    })

    return module
  }
}

// 1. 搭建结构
function webpack(webpackOptions) {
  // 2.使用传入参数,初始化webpack的Compiler对象
  const compiler = new Compiler(webpackOptions)
  // 3. 挂载配置文件中的插件
  const { plugins } = webpackOptions
  for (const plugin of plugins) plugin.apply(compiler)

  return compiler
}

// plugin
// Webpack Plugin 其实就是一个普通的函数，在该函数中需要我们定制一个 apply 方法
// 当 Webpack 内部进行插件挂载时会执行 apply 函数


module.exports = {
  webpack,
}
