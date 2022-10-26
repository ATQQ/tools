// npx esno minify.ts
import fs from 'fs'
import path from 'path'
import posthtml, { Node } from 'posthtml'
import { minifyCode } from '../../src/index'

const content = fs.readFileSync(path.join(__dirname, '../test.html'), 'utf-8')

function posthtmlScriptContentTransform(transformFn: (v: string) => string) {
  return (tree: Node) => {
    tree.match({ tag: 'script' }, (node) => {
      if (node?.content?.[0]) {
        node.content[0] = transformFn(node.content[0].toString())
      }
      return node
    })
  }
}
function traverseScript(htmlCode: string, transformFn: (v: string) => string) {
  return (
    posthtml()
      .use(posthtmlScriptContentTransform(transformFn))
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .process(htmlCode, { sync: true }).html
  )
}
const res = traverseScript(content, minifyCode)
console.log(res)
