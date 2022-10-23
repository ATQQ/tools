// npx esno gogocode.ts
import fs from 'fs'
import path from 'path'
import $ from 'gogocode'

const content = fs.readFileSync(path.join(__dirname, '../test.html'), 'utf-8')

function simpleConst2Var(code: string) {
  return code.replace(/const /g, 'var ')
}

function traverseScript(htmlCode: string, transformFn: (v: string) => string) {
  const htmlAST = $(htmlCode, { parseOptions: { language: 'html' } })
  htmlAST.find(`<script>$_$</script>`).each(($scriptNode) => {
    const origin = $scriptNode.attr('content.value.content')
    $scriptNode.attr('content.value.content', transformFn(origin.toString()))
  })
  return htmlAST.generate()
}
const res = traverseScript(content, simpleConst2Var)
console.log(res)
