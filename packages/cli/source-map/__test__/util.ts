import path from 'path'
import {
  getErrorSourceResult,
  printResult,
  outPutSources,
  getSourceCode,
  getSourcesBySourceMapCode,
  getRemoteSource
} from '../src'

// getRemoteSourceMapFilePath(
//   'https://script.sugarat.top/js/tests/index.9bb0da5c.js'
// ).then(console.log)

// 解析远程资源错误
// getErrorSourceResult(
//   'https://script.sugarat.top/js/tests/index.9bb0da5c.js',
//   24,
//   17596
// ).then(printResult)

// 解析本地资源错误local
// getErrorSourceResult(
//   path.resolve(__dirname, '../__test__/test-files/index.9bb0da5c.js'),
//   24,
//   17596
// ).then(printResult)

// 源码输出到本地
getRemoteSource(
  'https://script.sugarat.top/js/tests/index.9bb0da5c.js.map'
).then(async ({ body }) => {
  const sources = await getSourcesBySourceMapCode(body)
  console.log(sources.length, '个文件')
  outPutSources(sources)
})
