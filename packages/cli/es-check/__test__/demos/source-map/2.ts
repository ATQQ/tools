/* eslint-disable no-await-in-loop */
import fg from 'fast-glob'
import path from 'path'
import fs from 'fs'
import {
  checkCode,
  getSourcemapFileContent,
  parseSourceMap
} from '../../../src/util'

const testPattern = path.join(__dirname, '../../testProject/dist/*.js')
const files = fg.sync(testPattern)

;(async () => {
  for (const file of files) {
    // console.log(file)
    const code = fs.readFileSync(file, 'utf-8')
    const codeErrorList = checkCode(code)
    const sourceMapContent = getSourcemapFileContent(file)
    if (sourceMapContent) {
      const consumer = await parseSourceMap(sourceMapContent)

      codeErrorList.forEach((v) => {
        // 解析获取原文件信息
        const smStart = consumer.originalPositionFor({
          line: v.loc.start.line,
          column: v.loc.start.column
        })
        const smEnd = consumer.originalPositionFor({
          line: v.loc.end.line,
          column: v.loc.end.column
        })
        // start对应源码所在行的代码
        const sourceStartCode = consumer
          .sourceContentFor(smStart.source!)
          ?.split(/\r?\n/g)[smStart.line! - 1]
        const sourceEndCode = consumer
          .sourceContentFor(smEnd.source!)
          ?.split(/\r?\n/g)[smEnd.line! - 1]
        console.dir(
          {
            file,
            ...v,
            sourceMap: {
              source: {
                start: sourceStartCode,
                end: sourceEndCode
              },
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
            }
          },
          { depth: null }
        )
      })
    }
  }
})()
