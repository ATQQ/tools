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
  let errorFn: (err: Error, source: string) => void = (err, source) => {
    console.log('error url:', source)
    console.log('error msg:', err.message)
    console.log()
  }

  const thisArg = {
    progress: (fn: typeof progressFn) => {
      progressFn = fn
      return thisArg
    },
    end: (fn: typeof endFn) => {
      endFn = fn
      return thisArg
    },
    error: (fn: typeof errorFn) => {
      errorFn = fn
      return thisArg
    }
  }
  let request: http.ClientRequest
  const reqOptions = {
    agent: ops.proxy ? new HttpProxyAgent(ops.proxy) : undefined,
    timeout: ops.timeout || 0,
    headers: {
      'User-Agent': 'node http module'
    }
  }
  const responseCallback = (response: http.IncomingMessage) => {
    const { statusCode } = response
    if (Math.floor(statusCode! / 100) === 3 && ops.maxRedirects) {
      ops.maxRedirects -= 1
      if (response.headers.location) {
        // 递归
        downloadByUrl(response.headers.location, ops)
          // 透传事件
          .progress(progressFn)
          .end(endFn)
          .error(errorFn)
        return
      }
      throw new Error(`url:${url} status ${statusCode} without location header`)
    }
    // 404
    if (statusCode === 404) {
      request.emit('error', new Error('404 source'))
      return
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
  const _http = url.startsWith('https') ? https : http

  try {
    request = _http.get(url, reqOptions, responseCallback)
    request.on('error', (err) => {
      request.destroy()
      errorFn && errorFn(err, url)
    })
    request.on('timeout', () => {
      request.emit('error', new Error('request timeout'))
    })
  } catch (error: any) {
    setTimeout(() => {
      errorFn && errorFn(error, url)
    })
  }

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

downloadByUrl(
  'http://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png'
)
downloadByUrl('https://sugarat.top/404')
downloadByUrl('other str')
