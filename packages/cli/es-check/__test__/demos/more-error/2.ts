import * as acorn from 'acorn'
import * as acornWalk from 'acorn-walk'

const code = `
const obj = {
  'boolean': true,
}
`
const ast = acorn.parse(code, {
  ecmaVersion: 'latest'
})

let i = 0
acornWalk.full(ast, (node, _state, _type) => {
  // 节点对应的源码
  const codeSnippet = code.slice(node.start, node.end)
  let isValidCode = true

  // 判断代码片段 是否合法
  try {
    acorn.parse(codeSnippet, {
      ecmaVersion: 'latest'
    })
  } catch (_) {
    isValidCode = false
  }

  // 不合法不处理
  if (!isValidCode) {
    return
  }

  try {
    acorn.parse(codeSnippet, {
      ecmaVersion: '5'
    } as any)
  } catch (error: any) {
    // 在这里输出错误片段和解析报错原因
    console.log('=============', ++i, '=========')
    console.log(codeSnippet)
    console.log(error.message)
  }
})
