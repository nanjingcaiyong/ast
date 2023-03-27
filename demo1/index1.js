const fs = require('fs')
const code = fs.readFileSync('./example.js', 'utf-8')
const babelParser = require('@babel/parser')
const babelTraverse = require('@babel/traverse')
const babelGenerator = require('@babel/generator')
const t = require('@babel/types')
const ast = babelParser.parse(code)
babelTraverse.default(ast, {
  ArrowFunctionExpression: {
    exit: (path) => {
      path.replaceWith(t.functionExpression(path.node.id, path.node.params, path.node.body))
    }
  }
}
)
console.error(babelGenerator.default(ast))

