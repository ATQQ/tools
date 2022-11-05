import path from 'path'
import { getErrorSourceResult, printResult } from '../src'

// getRemoteSourceMapFilePath(
//   'https://script.sugarat.top/js/tests/index.9bb0da5c.js'
// ).then(console.log)

// remote
getErrorSourceResult(
  'https://script.sugarat.top/js/tests/index.9bb0da5c.js',
  24,
  17596
).then(printResult)

// local
// getErrorSourceResult(
//   path.resolve(__dirname, '../__test__/test-files/index.9bb0da5c.js'),
//   24,
//   17596
// ).then(printResult)
