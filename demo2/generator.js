const babelGenerator = require("@babel/generator")
const prettier = require("prettier")

/**
 * 生成template内部JS表达式
 * 字符串需要使用单引号
 * 函数调用末尾的分号需要移除
 */
exports.generateInterpolation = function(
  ast
) {
  // that's a hack, because @babel/generator will give a semi after a callexpression
  return babelGenerator(ast, {
    compact: false,
    jsescOption: {
      quotes: "single",
    },
  }).code.replace(/;/gm, "");
}

/**
 * 生成script内部的JS
 */
exports.generateJS =  function (ast) {
  return babelGenerator(ast).code;
}

/**
 * 组合template，script，style
 */
exports.generateSfc=  function (descriptor) {
  let result = "";

  const { template, script, scriptSetup, styles, customBlocks } = descriptor;
  [template, script, scriptSetup, ...styles, ...customBlocks].forEach(
    (block) => {
      if (block?.type) {
        result += `<${block.type}${Object.entries(block.attrs).reduce(
          (attrCode, [attrName, attrValue]) => {
            if (attrValue === true) {
              attrCode += ` ${attrName}`;
            } else {
              attrCode += ` ${attrName}="${attrValue}"`;
            }

            return attrCode;
          },
          " "
        )}>${block.content}</${block.type}>`;
      }
    }
  );

  return prettier.format(result, {
    parser: "vue",
    singleQuote: true,
    semi: false,
    tabWidth: 2,
    endOfLine: "auto"
  });
}
const generateTemplate = function (
  templateAst,
  children = ""
) {
  if (templateAst?.children?.length) {
    children = templateAst.children.reduce((result, child) => {
      return result + generateTemplate(child);
    }, "");
  }

  // 元素节点
  if (templateAst.type === 1) {
    return generateElement(templateAst, children);
  }

  return templateAst.loc.source;
}
exports.generateTemplate = generateTemplate

function generateElement(node, children) {
  let attributes = "";

  if (node.props.length) {
    attributes = ` ${generateElementAttr(node.props)}`;
  }

  if (node.tag) {
    // 自关闭标签：https://html.spec.whatwg.org/multipage/syntax.html#void-elements
    const selfClosingTags = [
      "area",
      "base",
      "br",
      "col",
      "embed",
      "hr",
      "img",
      "input",
      "link",
      "meta",
      "param",
      "source",
      "track",
      "wbr",
    ];

    if (node.isSelfClosing || selfClosingTags.includes(node.tag)) {
      return `<${node.tag}${attributes} />`;
    }

    return `<${node.tag}${attributes}>${children}</${node.tag}>`;
  }

  return children;
}

function generateElementAttr(attrs) {
  return attrs
    .map((attr) => {
      return attr.loc.source;
    })
    .join(" ");
}
