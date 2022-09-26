import * as acorn from 'acorn'
import * as acornWalk from 'acorn-walk'

import fs from 'fs'
import type { CodeError, ParserOptions } from '../types'

export function checkCode(code: string, options?: ParserOptions) {
  const ast = acorn.parse(code, {
    ecmaVersion: 'latest'
  })
  const ecmaVersion = options?.ecmaVersion || '5'
  const sourceType = options?.sourceType || 'script'
  const allowHashBang = options?.allowHashBang || false

  const codeErrorList: CodeError[] = []
  // traverse
  acornWalk.full(ast, (node, _state, _type) => {
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

    // 合法再parse检测
    try {
      acorn.parse(codeSnippet, {
        ecmaVersion,
        sourceType,
        allowHashBang
      } as any)
    } catch (_err: any) {
      const locStart = acorn.getLineInfo(code, node.start)
      const locEnd = acorn.getLineInfo(code, node.end)
      const isRepeat = codeErrorList.find((e) => {
        return e.start >= node.start && e.end <= node.end
      })
      if (!isRepeat) {
        codeErrorList.push({
          start: node.start,
          end: node.end,
          loc: {
            start: locStart,
            end: locEnd
          },
          source: codeSnippet,
          message: _err.message
        })
      }
    }
  })

  return codeErrorList
}

export function checkFile(file: string, options?: ParserOptions) {
  const code = fs.readFileSync(file, 'utf-8')
  const codeErrorList = checkCode(code, options)
  return codeErrorList
}
