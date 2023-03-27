const fs = require('fs')
const babelCore = require('@babel/core')
const code = fs.readFileSync('./example.js', 'utf-8')
const t = require('@babel/types')
const res = babelCore.transform(code,
  {
    plugins: [{
      visitor: {
        ArrowFunctionExpression: (path) => {
          path.replaceWith(t.functionExpression(path.node.id, path.node.params, path.node.body))
        }
      }
    }]
  })
  console.error(res)
  