// npx esno hyntax.ts
import fs from 'fs'
import path from 'path'
import { constructTree, tokenize } from 'hyntax'

import util from 'util'

const content = fs.readFileSync(path.join(__dirname, '../test.html'), 'utf-8')

function simpleConst2Var(code: string) {
  return code.replace(/const /g, 'var ')
}

function traverseScript(htmlCode: string, transformFn: (v: string) => string) {
  const { tokens } = tokenize(htmlCode)
  const { ast } = constructTree(tokens)
  console.log(JSON.stringify(tokens, null, 2))
  console.log(util.inspect(ast, { showHidden: false, depth: null }))
  return htmlCode
}
const res = traverseScript(content, simpleConst2Var)
console.log(res)
