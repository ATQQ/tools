/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-expressions */
import https from 'https'
import http from 'http'
import fs from 'fs'
import path from 'path'
import { DownloadOptions } from '../types'

const HttpProxyAgent = require('http-proxy-agent')

function randomName(length = 6) {
  return Math.random()
    .toString(26)
    .slice(2, 2 + length)
}

export const underlineStr = (v: any) => `\x1B[4m${v}\x1B[24m`

export const yellowStr = (v: any) => `\x1B[33m${v}\x1B[39m`

export const redStr = (v: any) => `\x1B[31m${v}\x1B[39m`

export function downloadByUrl(url: string, option?: Partial<DownloadOptions>) {
  const ops: DownloadOptions = {
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
      request.emit('error', new Error(`request timeout ${ops.timeout}ms`))
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
export function nameParse(filename: string, suffix = ''): ParseResult {
  const { name, ext } = path.parse(filename)
  if (name === filename) {
    return { name, ext: ext + suffix }
  }
  return nameParse(name, ext + suffix)
}

export function normalizeFilename(name: string) {
  return name.replace(/[\\/:*?"<>|]/g, '')
}

export function getValidFilenameByUrl(url: string) {
  const urlInstance = new URL(url)
  return decodeURIComponent(path.basename(urlInstance.pathname))
}

export function getNoRepeatFilepath(filename: string, dir = process.cwd()) {
  const { name, ext } = nameParse(filename)
  let i = 0
  let filepath = ''
  do {
    filepath = path.join(dir, `${name}${i ? ` ${i}` : ''}${ext}`)
    i += 1
  } while (fs.existsSync(filepath))
  return filepath
}

export function formatSize(
  size: number,
  pointLength?: number,
  units?: string[]
) {
  let unit
  units = units || ['B', 'K', 'M', 'G', 'TB']
  // eslint-disable-next-line no-cond-assign
  while ((unit = units.shift()) && size > 1024) {
    size /= 1024
  }
  return (
    (unit === 'B'
      ? size
      : size.toFixed(pointLength === undefined ? 2 : pointLength)) + unit!
  )
}

/**
 * @param cycle 多久算一次（ms）
 */
export function getSpeedCalculator(cycle = 500) {
  let startTime = 0
  let endTime = 0
  let speed = 'N/A'
  let sum = 0

  return (chunk: number) => {
    sum += chunk
    if (startTime === 0) {
      startTime = Date.now()
    }
    endTime = Date.now()
    // 计算一次
    if (endTime - startTime >= cycle) {
      speed = `${formatSize((1000 / (endTime - startTime)) * sum)}/s`
      startTime = Date.now()
      sum = 0
    }
    return speed
  }
}

const configPath = path.join(
  process.env.HOME || process.env.USERPROFILE || process.cwd(),
  '.efstrc'
)

export function getCLIConfig(key = '') {
  try {
    const value = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    return !key
      ? value
      : key.split('.').reduce((pre, k) => {
          return pre?.[key]
        }, value)
  } catch {
    return !key ? {} : ''
  }
}

export function setCLIConfig(key: string, value: string) {
  if (!key || !value) {
    return
  }
  const nowCfg = getCLIConfig()
  const keys = key.split('.')
  keys.reduce((pre, k, i) => {
    // 赋值
    if (i === keys.length - 1) {
      pre[k] = value
    } else if (!(pre[k] instanceof Object)) {
      pre[k] = {}
    }
    return pre[k]
  }, nowCfg)
  fs.writeFileSync(configPath, JSON.stringify(nowCfg, null, 2))
}

export function delCLIConfig(key: string) {
  if (!key) {
    return
  }
  const nowCfg = getCLIConfig()
  const keys = key.split('.')
  keys.reduce((pre, k, i) => {
    // 移除
    if (i === keys.length - 1) {
      delete pre[k]
    }
    return pre[k] instanceof Object ? pre[k] : {}
  }, nowCfg)
  fs.writeFileSync(configPath, JSON.stringify(nowCfg, null, 2))
}
