const fs = require('fs')
const posthtml = require('posthtml')
const htmlStr = fs.readFileSync(__dirname, './index.html')

const result = posthtml()
  .use(require('posthtml-custom-elements')())
  .process(html, { sync: true })
  .html

console.log(result)



