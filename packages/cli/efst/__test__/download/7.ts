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
  override: boolean
}
// 实现5: 支持设置超时时间
function downloadByUrl(url: string, option?: Partial<Options>) {
  const ops: Options = {
    timeout: 3000,
    filename: '',
    maxRedirects: 10,
    proxy: '',
    override: false,
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
      const filename = normalizeFilename(
        ops.filename || getValidFilenameByUrl(url) || randomName()
      )

      const filepath = ops.override
        ? path.resolve(filename)
        : getNoRepeatFilepath(filename)

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

interface ParseResult {
  name: string
  ext: string
}
function nameParse(filename: string, suffix = ''): ParseResult {
  const { name, ext } = path.parse(filename)
  if (name === filename) {
    return { name, ext: ext + suffix }
  }
  return nameParse(name, ext + suffix)
}

function normalizeFilename(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, '')
}

function getValidFilenameByUrl(url: string) {
  const urlInstance = new URL(url)
  return decodeURIComponent(path.basename(urlInstance.pathname))
}

function getNoRepeatFilepath(filename: string, dir = process.cwd()) {
  const { name, ext } = nameParse(filename)
  let i = 0
  let filepath = ''
  do {
    filepath = path.join(dir, `${name}${i ? ` ${i}` : ''}${ext}`)
    i += 1
  } while (fs.existsSync(filepath))
  return filepath
}

downloadByUrl('https://img.cdn.sugarat.top/docs/images/test/avatar.png').end(
  (filepath) => {
    console.log('file save:', filepath)
  }
)
downloadByUrl(
  'https://img.cdn.sugarat.top/docs/images/test/%E5%A4%B4%E5%83%8F.png'
).end((filepath) => {
  console.log('file save:', filepath)
})
