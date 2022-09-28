import * as acorn from 'acorn'
import * as acornWalk from 'acorn-walk'

const code = `var str = 'hello'
var str2 = 'world'

const varConst = 'const'
let varLet = 'let'
const arrFun = () => {
    console.log('hello world');
}`
const ast = acorn.parse(code, {
  ecmaVersion: 'latest'
})

const codeErrorList: any[] = []
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
    const filterMessage = [/^The keyword /]
    if (filterMessage.find((r) => r.test(error.message))) {
      return
    }
    // 在这里输出错误片段和解析报错原因
    const isRepeat = codeErrorList.find((e) => {
      return e.start >= node.start && e.end <= node.end
    })

    const locStart = acorn.getLineInfo(code, node.start)
    const locEnd = acorn.getLineInfo(code, node.end)
    if (!isRepeat) {
      codeErrorList.push({
        codeSnippet,
        start: node.start,
        end: node.end,
        loc: {
          start: locStart,
          end: locEnd
        }
      })
    }
  }
})

console.dir(codeErrorList, {
  depth: 3
})
