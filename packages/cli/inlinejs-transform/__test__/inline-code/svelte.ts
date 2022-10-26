// npx esno svelte.ts
import fs from 'fs'
import path from 'path'
import * as svelte from 'svelte/compiler'

const content = fs.readFileSync(path.join(__dirname, '../test.html'), 'utf-8')

function simpleConst2Var(code: string) {
  return code.replace(/const /g, 'var ')
}

function traverseScript(htmlCode: string, transformFn: (v: string) => string) {
  // const AST = svelte.compile(htmlCode).ast
  // const htmlAST = AST.html
  return svelte
    .preprocess(htmlCode, {
      script(ops) {
        return {
          code: transformFn(ops.content)
        }
      }
    })
    .then((v) => v.code)
}
const res = traverseScript(content, simpleConst2Var)
res.then(console.log)
