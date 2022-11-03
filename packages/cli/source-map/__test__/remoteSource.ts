import http from 'http'
import https from 'https'
import axios from 'axios'
import fetch from 'node-fetch'
import { getErrorSourceResult, getRemoteSourceMapFilePath } from '../src'

function getRemoteSource(
  url: string
): Promise<{ body: string; code?: number }> {
  return new Promise((resolve, reject) => {
    // 区别https与http资源
    const HTTP = url.startsWith('https://') ? https : http

    // 通过回调的形式获取
    HTTP.get(url, (res) => {
      // 设置可读流的字符编码
      res.setEncoding('utf-8')

      // 响应内容拼接
      let content = ''
      res.on('data', (chunk) => {
        content += chunk
      })

      // 读完对外暴露内容和状态码
      res.on('end', () => {
        resolve({
          body: content,
          code: res.statusCode
        })
      })

      res.on('error', (err) => {
        reject(err)
      })
    })
  })
}

function getRemoteSourceByAxios(url: string) {
  return axios.get(url).then((v) => {
    return {
      code: v.status,
      body: v.data
    }
  })
}

function getRemoteSourceByFetch(url: string) {
  return fetch(url).then(async (v) => {
    const code = v.status
    const body = await v.text()
    return {
      code,
      body
    }
  })
}

getRemoteSourceMapFilePath(
  'https://script.sugarat.top/js/tests/index.9bb0da5c.js'
).then(console.log)

getErrorSourceResult(
  'https://script.sugarat.top/js/tests/index.9bb0da5c.js',
  24,
  17596
).then((v) => {
  console.log(v.source, v.line, v.column)
})
