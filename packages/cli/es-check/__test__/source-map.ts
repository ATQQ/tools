// npx esno source-map.ts

import sourceMap from 'source-map'
import fs from 'fs'
import path from 'path'

const file = path.join(__dirname, 'testProject/dist/index.js.map')
const lineNumber = 1
const columnNumber = 45

;(async () => {
  const consumer = await new sourceMap.SourceMapConsumer(
    fs.readFileSync(file, 'utf-8')
  )
  const sm = consumer.originalPositionFor({
    column: columnNumber,
    line: lineNumber
  })
  // 对应文件的源码
  const content = consumer.sourceContentFor(sm.source!)
  // 错误行的代码
  const errCode = content?.split(/\r?\n/g)[sm.line! - 1]
  console.log(errCode)
})()
