/* eslint-disable no-param-reassign */
import * as acorn from 'acorn'
import * as acornWalk from 'acorn-walk'
import * as parse5 from 'parse5'
import sourceMap from 'source-map'

import fs from 'fs'
import type { CodeError, FileError, ParserOptions } from '../types'

export function traverseHtmlAST(ast: any, traverseSchema: Record<string, any>) {
  traverseSchema?.[ast?.nodeName]?.(ast)
  if (ast?.nodeName !== ast?.tagName) {
    traverseSchema?.[ast?.tagName]?.(ast)
  }
  ast?.childNodes?.forEach((n: any) => {
    traverseHtmlAST(n, traverseSchema)
  })
}
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
      const { message } = _err
      const filterMessage = [/^The keyword /]
      if (filterMessage.find((r) => r.test(message))) {
        return
      }

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
          message
        })
      }
    }
  })

  return codeErrorList
}

export function checkHtmlCode(code: string, option?: ParserOptions) {
  const htmlAST = parse5.parse(code, {
    sourceCodeLocationInfo: true
  })
  const errList: CodeError[] = []
  traverseHtmlAST(htmlAST, {
    script(node: any) {
      const scriptCode = `${node.childNodes.map((n: any) => n.value)}`
      const loc = node.sourceCodeLocation
      if (code) {
        const errs = checkCode(scriptCode, option)
        errList.push(
          ...errs.map((err) => {
            // 拼接html解析出的标签位置
            // TODO:细节待测试，补齐单侧用例
            err.loc.start.line += loc.startLine - 1
            err.loc.end.line += loc.startLine - 1
            err.start += loc.startOffset
            err.end += loc.startOffset
            return err
          })
        )
      }
    }
  })
  return errList
}

export async function checkFile(
  file: string,
  options?: ParserOptions
): Promise<FileError[]> {
  const code = fs.readFileSync(file, 'utf-8')
  // support html and js
  const codeErrorList = file.endsWith('.html')
    ? checkHtmlCode(code, options)
    : checkCode(code, options)

  const sourceMapContent = getSourcemapFileContent(file)
  if (sourceMapContent) {
    const consumer = await parseSourceMap(sourceMapContent)
    return codeErrorList.map((v) => {
      const smStart = consumer.originalPositionFor({
        line: v.loc.start.line,
        column: v.loc.start.column
      })
      const smEnd = consumer.originalPositionFor({
        line: v.loc.end.line,
        column: v.loc.end.column
      })
      const sourceCode = consumer.sourceContentFor(smStart.source!)
      return {
        ...v,
        file,
        sourceMap: {
          file: smStart.source,
          source: sourceCode?.split(/\r?\n/g)[smStart.line! - 1],
          loc: {
            start: {
              line: smStart.line,
              column: smStart.column
            },
            end: {
              line: smEnd.line,
              column: smEnd.column
            }
          }
        } as FileError
      }
    })
  }
  return codeErrorList.map((v) => {
    return {
      ...v,
      file
    }
  })
}

export function parseSourceMap(code: string) {
  const consumer = new sourceMap.SourceMapConsumer(code)
  return consumer
}

export function getSourcemapFileContent(file: string) {
  const sourceMapFile = `${file}.map`
  if (fs.existsSync(sourceMapFile)) {
    return fs.readFileSync(sourceMapFile, 'utf-8')
  }
  return ''
}

export function getEcmaVersion(version: string) {
  // es6 es2015
  const reg = /es(\d{1,2}|\d{4})/
  if (reg.test(version)) {
    const ecmaVersion = +version.match(reg)![1]
    return `${ecmaVersion}`
  }
  return ''
}
