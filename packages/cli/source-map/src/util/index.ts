import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import http from 'http'
import https from 'https'
import fs from 'fs/promises'
import sourceMap from 'source-map'
import { SourceItem, SourceResult } from '../types'

const NOT_FOUND = null

function createSourceMapConsumer(sourceMapCode: string) {
  const consumer = new sourceMap.SourceMapConsumer(sourceMapCode)
  return consumer
}

export const isHTTPSource = (sourcePath: string) =>
  sourcePath.startsWith('http')

export async function getSourceMapFilePath(sourceJsPath: string) {
  if (!isHTTPSource(sourceJsPath)) {
    return getLocalSourceMapFilePath(sourceJsPath)
  }
  return getRemoteSourceMapFilePath(sourceJsPath)
}

export function getLocalSourceMapFilePath(sourceJsPath: string) {
  // 文件不存在
  if (!existsSync(sourceJsPath)) {
    return NOT_FOUND
  }

  // 先直接判断是否存在.js.map文件存在
  if (existsSync(`${sourceJsPath}.map`)) {
    return `${sourceJsPath}.map`
  }

  // 获取代码里的 // #sourceMappingURL= 注释的内容
  const jsCode = readFileSync(sourceJsPath, 'utf-8')
  const flag = '//# sourceMappingURL='
  const flagIdx = jsCode.lastIndexOf(flag)
  if (flagIdx === -1) {
    return NOT_FOUND
  }
  const sourceMappingURL = jsCode.slice(flagIdx + flag.length)

  // 如果是http路径表明 是绝对路径 直接返回
  if (isHTTPSource(sourceMappingURL)) {
    return sourceMappingURL
  }

  // 否则拼接js资源的目录
  return path.resolve(path.dirname(sourceJsPath), sourceMappingURL)
}

export async function getRemoteSourceMapFilePath(sourceJsPath: string) {
  const context = await getRemoteSource(sourceJsPath)
  if (context.code === 404) {
    return NOT_FOUND
  }
  if ((await getRemoteSource(`${sourceJsPath}.map`)).code === 200) {
    return `${sourceJsPath}.map`
  }
  const jsCode = context.body
  const flag = '//# sourceMappingURL='
  const flagIdx = jsCode.lastIndexOf(flag)

  if (flagIdx === -1) {
    return NOT_FOUND
  }
  const sourceMappingURL = jsCode.slice(flagIdx + flag.length)
  if (isHTTPSource(sourceMappingURL)) {
    return sourceMappingURL
  }
  return path.resolve(path.dirname(sourceJsPath), sourceMappingURL)
}

export function getRemoteSource(
  url: string
): Promise<{ body: string; code?: number }> {
  return new Promise((resolve, reject) => {
    // 区别https与http资源
    const HTTP = url.startsWith('https://') ? https : http

    // 通过回调的形式获取
    HTTP.get(url, (res) => {
      // 设置可读流的字符编码
      res.setEncoding('utf-8')

      // 响应内容拼接
      let content = ''
      res.on('data', (chunk) => {
        content += chunk
      })

      // 读完对外暴露内容和状态码
      res.on('end', () => {
        resolve({
          body: content,
          code: res.statusCode
        })
      })

      res.on('error', (err) => {
        reject(err)
      })
    })
  })
}

/**
 * 根据报错资源信息，获取对应源码信息
 * @param url 报错资源
 * @param line 行号
 * @param column 列号
 */
export async function getErrorSourceResult(
  url: string,
  line: number,
  column: number
): Promise<SourceResult> {
  const unknown: SourceResult = {
    sourceCode: '',
    source: '',
    line: 0,
    column: 0
  }
  const sourceMapURL = await getSourceMapFilePath(url)
  if (!sourceMapURL) {
    return unknown
  }

  return getErrorSourceResultBySourceMapUrl(sourceMapURL, line, column)
}

export async function getErrorSourceResultBySourceMapUrl(
  sourceMapURL: string,
  line: number,
  column: number
): Promise<SourceResult> {
  // sourceMap 内容
  const sourceMapCode = await getSourceCode(sourceMapURL)

  return getErrorSourceResultBySourceMapCode(sourceMapCode, line, column)
}

export async function getSourceCode(url: string) {
  const code = await (isHTTPSource(url)
    ? getRemoteSource(url).then((v) => v.body)
    : fs.readFile(url, 'utf-8'))
  return code
}

export async function getErrorSourceResultBySourceMapCode(
  sourceMapCode: string,
  line: number,
  column: number
): Promise<SourceResult> {
  const consumer = await createSourceMapConsumer(sourceMapCode)
  const { name, ...rest } = consumer.originalPositionFor({
    line,
    column
  })
  const sourceCode = consumer.sourceContentFor(rest.source!)
  return {
    ...rest,
    sourceCode
  } as SourceResult
}

export const underlineStr = (v: any) => `\x1B[4m${v}\x1B[24m`

export const yellowStr = (v: any) => `\x1B[33m${v}\x1B[39m`

export const redStr = (v: any) => `\x1B[31m${v}\x1B[39m`

/**
 * @param result
 * @param showMaxLine 控制显示的行数
 */
export function printResult(result: SourceResult, showMaxLine = 5) {
  const { sourceCode, source, line, column } = result
  // 源码拆成数租
  const lines = sourceCode.split('\n')

  // 打印错误路径
  console.log(`error in  ${source}:${line}:${column}`)
  console.log()

  // 计算要展示的行的起始位置，起始行号不能小于1
  const startLine = Math.max(1, line - Math.floor(showMaxLine / 2))
  // 结束位置不能大于总行数
  const endLine = Math.min(lines.length, startLine + showMaxLine - 1)

  const showCode = lines
    // 截取需要展示的内容
    .slice(startLine - 1, endLine)
    .map(
      (v, idx) =>
        // 加上黄色行号
        `${yellowStr(startLine + idx)} ${
          // 针对错误的行进行下划线+红色展示
          idx + startLine === line
            ? // 从错误的列号开始展示
              v.slice(0, column - 1) + redStr(underlineStr(v.slice(column - 1)))
            : v
        }`
    )
    .join('\n')

  console.log(showCode)
}

export function outPutResult(
  outputDir: string,
  logFilename: string,
  result: SourceResult,
  showMaxLine = 5
) {
  const outputFile = path.resolve(process.cwd(), outputDir, logFilename)
  console.log(`error output in file:

  ${yellowStr(outputFile)}`)

  const { sourceCode, source, line, column } = result
  const lines = sourceCode.split('\n')
  const error = []
  error.push(`error in  ${source}`, `line:${line} column:${column}`, '')
  const startLine = Math.max(1, line - Math.floor(showMaxLine / 2))
  const endLine = Math.min(lines.length, startLine + showMaxLine - 1)
  const showCode = lines
    .slice(startLine - 1, endLine)
    .map(
      (v, idx) =>
        `${idx + startLine === line ? '❌' : ''}${startLine + idx} ${v}`
    )
  error.push(...showCode)

  if (!existsSync(path.dirname(outputFile))) {
    mkdirSync(path.dirname(outputFile), { recursive: true })
  }

  fs.writeFile(outputFile, error.join('\n'))
}
/**
 * 通过sourceMap内容获取源文件
 */
export async function getSourcesBySourceMapCode(sourceMapCode: string) {
  const consumer = await createSourceMapConsumer(sourceMapCode)
  const { sources } = consumer
  const result = sources.map((source) => {
    return {
      source,
      code: consumer.sourceContentFor(source)!
    }
  })
  return result
}

export async function outPutSources(
  sources: SourceItem[],
  outPutDir = 'source-map-result/project'
) {
  for (const sourceItem of sources) {
    const { source, code } = sourceItem
    const filepath = path.resolve(
      process.cwd(),
      outPutDir,
      source.replace(/^(\.\.\/)+/g, '')
    )
    if (!existsSync(path.dirname(filepath))) {
      mkdirSync(path.dirname(filepath), { recursive: true })
    }
    writeFileSync(filepath, code, 'utf-8')
  }
}
