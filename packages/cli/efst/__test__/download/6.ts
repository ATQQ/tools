/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-expressions */
import https from 'https'
import http from 'http'
import fs from 'fs'
import path from 'path'

const HttpProxyAgent = require('http-proxy-agent')

function randomName(length = 6) {
  return Math.random()
    .toString(26)
    .slice(2, 2 + length)
}

interface Options {
  filename: string
  maxRedirects: number
  timeout: number
  proxy: string
}
// 实现5: 支持设置超时时间
function downloadByUrl(url: string, option?: Partial<Options>) {
  const ops: Options = {
    timeout: 300000,
    filename: randomName(),
    maxRedirects: 10,
    proxy: '',
    ...option
  }

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
  const request = _http.get(
    url,
    {
      agent: ops.proxy ? new HttpProxyAgent(ops.proxy) : undefined,
      timeout: ops.timeout || 0,
      headers: {
        'User-Agent': 'node http module'
      }
    },
    (response) => {
      const { statusCode } = response
      if (Math.floor(statusCode! / 100) === 3 && ops.maxRedirects) {
        ops.maxRedirects -= 1
        if (response.headers.location) {
          // 递归
          downloadByUrl(response.headers.location, ops)
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
      const filepath = path.resolve(ops.filename || randomName())
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
  request.on('timeout', () => {
    request.destroy()
    console.error(`http request timeout url:${url}`)
  })
  return thisArg
}

const sourceUrl =
  'http://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png'

downloadByUrl(sourceUrl, {
  filename: 'goggle.png',
  timeout: 2000,
  proxy: 'http://127.0.0.1:7890'
})
  .progress((_, rec, sum) => {
    console.log(rec, sum)
  })
  .end((filepath) => {
    console.log('use proxy')
    console.log('file save:', filepath)
  })
