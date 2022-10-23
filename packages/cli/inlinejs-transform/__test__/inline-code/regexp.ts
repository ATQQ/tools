// npx esno regexp.ts
import fs from 'fs'
import path from 'path'

const content = fs.readFileSync(path.join(__dirname, '../test.html'), 'utf-8')

function simpleConst2Var(code: string) {
  return code.replace(/const /g, 'var ')
}

function traverseScript(htmlCode: string, transformFn: (v: string) => string) {
  const rScriptTag = /<script>([\s\S]*?)<\/script>/g
  return htmlCode.replace(rScriptTag, (all, $1) => {
    return all.replace($1, transformFn($1))
  })
}
const res = traverseScript(content, simpleConst2Var)
console.log(res)
