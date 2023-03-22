
      (() => {
       var modules = {
         
           "./src/name.js": (module) => {
             module.exports = '名字: siry'; // 给代码添加注释: loader2// 给代码添加注释: loader1
           }
         ,
           "./src/age.js": (module) => {
             module.exports = '年纪: 18'; // 给代码添加注释: loader2// 给代码添加注释: loader1
           }
         ,
           "./src/index.js": (module) => {
             const name = require("./src/name.js");
const age = require("./src/age.js");
console.log('个人信息', name, age);
// 给代码添加注释: loader2// 给代码添加注释: loader1
           }
           
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
       const name = require("./src/name.js");
const age = require("./src/age.js");
console.log('个人信息', name, age);
// 给代码添加注释: loader2// 给代码添加注释: loader1
     })();
      