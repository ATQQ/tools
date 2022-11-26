/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-expressions */
import https from 'https'
import http from 'http'
import fs from 'fs'
import path from 'path'

const sourceUrl =
  'https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/759e2aa805c0461b840e0f0f09ed05fa~tplv-k3u1fbpfcp-zoom-1.image'

function randomName(length = 6) {
  return Math.random()
    .toString(26)
    .slice(2, 2 + length)
}

// 实现3：文件直接下载，支持自动重定向
function downloadByUrl(url: string, filename?: string) {
  let receive = 0

  let progressFn: (cur: number, rec: number, sum: number) => void
  let endFn: (filepath: string) => void

  const thisArg = {
    progress: (fn: typeof progressFn) => {
      progressFn = fn
      return thisArg
    },
    end: (fn: typeof endFn) => {
      endFn = fn
      return thisArg
    }
  }

  const _http = url.startsWith('https') ? https : http
  _http.get(
    url,
    {
      headers: {
        'User-Agent': 'node http module'
      }
    },
    (response) => {
      const { statusCode } = response
      if (Math.floor(statusCode! / 100) === 3) {
        if (response.headers.location) {
          // 递归
          downloadByUrl(response.headers.location, filename)
            // 透传事件
            .progress(progressFn)
            .end(endFn)
          return
        }
        throw new Error(
          `url:${url} status ${statusCode} without location header`
        )
      }

      // 输出文件路径
      const filepath = path.resolve(filename || randomName())
      // 创建一个可写流
      const writeStream = fs.createWriteStream(filepath)

      const sumSize = +response.headers['content-length']! || 0
      response.on('data', (chunk: Buffer) => {
        receive += chunk.length
        progressFn && progressFn(chunk.length, receive, sumSize)
      })

      response.pipe(writeStream).on('close', () => {
        endFn && endFn(filepath)
      })
    }
  )
  return thisArg
}

downloadByUrl('http://mtw.so/5YIGGb', 'test.image').end((filepath) => {
  console.log('file save:', filepath)
})
