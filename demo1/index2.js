const fs = require('fs')
const code = fs.readFileSync('./index.vue', 'utf-8')
const babelParser = require('@babel/parser')
const babelTraverse = require('@babel/traverse')
const babelGenerator = require('@babel/generator')
const t = require('@babel/types')
const { path } = require('@babel/traverse/lib/cache')
let keysObj = {}
// 解析代码成AST
const ast = babelParser.parse(code)
// 代码转化
babelTraverse.default(ast, {
  TemplateLiteral: (path) =>{
    if (
      path.node.quasis.some((q) => /[\u{4E00}-\u{9FFF}]/gmu.test(q.value.cooked))
    ) {
      // 生成替换字符串，注意这里不需要过滤quasis里的空字符串
      const strArr = path.node.quasis
        .map((q) => q.value.cooked);
      const replaceStr = strArr.reduce(function (prev, cur, index) {
        if (index < strArr.length) {
          return prev += `{${index - 1}}${cur}`;
        }
        return prev + cur;
      });
      keysObj.key1 = replaceStr
      path.replaceWith(
        t.callExpression(
          t.identifier("$t"),
          [
            t.stringLiteral('key1'),
            t.arrayExpression(
              path.node.expressions
            ),
          ]
        )
      );
    }
  },
  StringLiteral: (path) => {
    if (/[\u{4E00}-\u{9FFF}]/gmu.test(path.node.value)) {
      keysObj.key2 = path.node.value
      path.replaceWith(t.callExpression(t.identifier('$t'), [t.stringLiteral('key2')]))
    }
  }
})
console.error(babelGenerator.default(ast))
console.error(keysObj)

