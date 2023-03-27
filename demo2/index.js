const fs = require('fs')
const vueParser = require("@vue/compiler-sfc")
const babelParser = require('@babel/parser')
const babelTraverse = require('@babel/traverse')
const babelGenerator = require('@babel/generator')
const { generateTemplate } = require('./generator.js')
const { generateHash } = require('./hash.js')
const t = require('@babel/types')

let locales = {}
const vueCode = fs.readFileSync('./src/index.vue', 'utf-8')
const parseRes = vueParser.parse(vueCode)
const template = parseRes.descriptor?.template
if (template.content && hasChineseCharacter(template.content)) {
  parseRes.descriptor.template.content = generateTemplate({
    ...transformTemplate(template.ast),
    tag: "",
  });
  fs.writeFileSync('./index.vue', `<template>${parseRes.descriptor.template.content}</template>`, 'utf-8')
  fs.writeFileSync(
    './i18n.json',
    JSON.stringify(locales, null, "\t"),
    "utf8"
  )
}


function transformTemplate(ast) {
  if (ast.type === 1) {
    ast.props = ast.props.map((prop) => {
      // 属性内容
      if (prop.type === 6) {
        if (hasChineseCharacter(prop?.value.content)) {
          const value = extractChar(prop.value.content)
          return {
            name: prop.name,
            type: 6,
            loc: { source: `:${prop.name}="$t('${value}')"` }
          }
        }
      }
      // 指令内容
      if (prop.type === 7) {
        if (hasChineseCharacter(prop?.exp.content)) {
          const ast = transformJs(prop?.exp.content)
          const str = babelGenerator.default(ast, {
            compact: false,
            jsescOption: {
              quotes: "single",
            },
          }).code.replace(/;/gm, "");
          return {
            name: prop.name,
            type: 6,
            loc: { source: `:${prop.arg.content}="${str}"` }
          }
        }
      }
      return prop
    })
    if (ast.children?.length) {
      ast.children.forEach((child) => {
        transformTemplate(child)
      })
    }
  }
  return ast
}

function hasChineseCharacter(code) {
  return code && /[\u{4E00}-\u{9FFF}]/gmu.test(code);
}
function extractChar(char) {
  const locale = char.trim();
  let key = generateHash(locale);
  locales[key] = locale;
  return key;
}
function transformJs(code) {
  const ast = babelParser.parse(code, { sourceType: 'module', plugins: ["jsx"] })
  babelTraverse.default(ast, {
    StringLiteral: {
      exit: (path) => {
        if (hasChineseCharacter(path.node.extra?.rawValue)) {
          const localeKey = extractChar(
            path.node.extra?.rawValue
          );
          path.replaceWith(
            t.callExpression(t.identifier("$t"), [
              t.stringLiteral(localeKey),
            ])
          );
        }
      }

    },
    TemplateLiteral: {
      exit: (path) => {
        if (
          path.node.quasis.some((q) => hasChineseCharacter(q.value.cooked))
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
          const localeKey = extractChar(replaceStr);
          path.replaceWith(
            t.callExpression(
              t.identifier("$t"),
              [
                t.stringLiteral(localeKey),
                t.arrayExpression(
                  path.node.expressions
                ),
              ]
            )
          );
        }
      }
    }
  })
  return ast
}
