import path from 'path'
import {
  getErrorSourceResult,
  getErrorSourceResultBySourceMapUrl,
  outPutResult,
  printResult
} from '../util'

interface Options {
  sourceMap?: boolean
  line?: string
  column?: string
  output: string | boolean
  showNum: string
}

export default async function parseCommand(
  sourceUrl: string,
  options: Options
) {
  const match = sourceUrl.match(/:\d+/)
  let url = sourceUrl
  let l
  let c
  if (match?.index) {
    ;[l, c] = sourceUrl.slice(match.index + 1).split(':')
    url = sourceUrl.slice(0, match.index)
  }

  const line = l || options.line
  const column = c || options.column
  if (!line) {
    console.log('you should set line number')
    return
  }

  if (!column) {
    console.log('you should set column number')
    return
  }
  const fn = options.sourceMap
    ? getErrorSourceResultBySourceMapUrl
    : getErrorSourceResult
  const result = await fn(url, +line, +column)
  if (options.output) {
    outPutResult(
      options.output === true ? './' : options.output,
      `${path.basename(url)}.log`,
      result,
      +options.showNum
    )
    return
  }

  printResult(result, +options.showNum)
}
