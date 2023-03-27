const fs = require('fs')
const code = fs.readFileSync('./example.js', 'utf-8')
const babelParser = require('@babel/parser')
const babelTraverse = require('@babel/traverse')
const babelGenerator = require('@babel/generator')
// 解析代码成AST
const ast = babelParser.parse(code)
// 代码转化
babelTraverse.default(ast, {
  CallExpression: (path) =>{
    const callee = path.node.callee
    if (callee?.object?.name === 'console' && (callee?.property.value === 'error' | callee?.property.name === 'error')) {
      path.remove()
    }
  }
})
console.error(babelGenerator.default(ast))

