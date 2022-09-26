import fg from 'fast-glob'
import path from 'path'
import * as acorn from 'acorn'
import * as acornWalk from 'acorn-walk'
import fs from 'fs'

const testPattern = path.join(__dirname, '../__test__/testProject/js/**/*.js')
// 要检查的文件
const files = fg.sync(testPattern)

files.forEach((file) => {
  const code = fs.readFileSync(file, 'utf8')
  const ast = acorn.parse(code, {
    ecmaVersion: 'latest'
  })
  const errorInfo: any[] = []
  acornWalk.full(ast, (node, state, type) => {
    const codeSnippet = code.slice(node.start, node.end)
    // console.log(node.start, node.end, type)
    try {
      acorn.parse(codeSnippet, {
        ecmaVersion: '5' as any
      })
    } catch (_err) {
      const startLine = acorn.getLineInfo(code, node.start)
      const endLine = acorn.getLineInfo(code, node.end)
      if (
        !errorInfo.find((e) => {
          return e.start >= node.start && e.end <= node.end
        })
      ) {
        errorInfo.push({
          file,
          start: node.start,
          end: node.end,
          loc: {
            start: {
              line: startLine.line,
              column: startLine.column
            },
            end: {
              line: endLine.line,
              column: endLine.column
            }
          },
          source: codeSnippet
        })
      }
    }
  })
  console.log(errorInfo)
})
