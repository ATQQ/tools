// npx esno posthtml.ts
import fs from 'fs'
import path from 'path'
import posthtml from 'posthtml'
import { posthtmlSWCMinify, posthtmlSWCTransform } from '../../src/index'

const content = fs.readFileSync(path.join(__dirname, '../test.html'), 'utf-8')

function traverseScript(htmlCode: string) {
  return (
    posthtml()
      .use(posthtmlSWCTransform('es5', true))
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .process(htmlCode, { sync: true }).html
  )
}

function minifyScript(htmlCode: string) {
  return (
    posthtml()
      .use(posthtmlSWCMinify())
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .process(htmlCode, { sync: true }).html
  )
}

console.log(traverseScript(content))
console.log(minifyScript(content))
