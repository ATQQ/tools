/* eslint-disable no-unused-expressions */
import https from 'https'
import fs from 'fs'
import path from 'path'

const sourceUrl =
  'https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/759e2aa805c0461b840e0f0f09ed05fa~tplv-k3u1fbpfcp-zoom-1.image'

function randomName(length = 6) {
  return Math.random()
    .toString(26)
    .slice(2, 2 + length)
}

// 文件直接下载
function downloadByUrl(url: string, filename?: string) {
  const filepath = path.resolve(filename || randomName())
  https.get(url, (response) => {
    // 创建1个可写流
    const writeStream = fs.createWriteStream(filepath)
    response.pipe(writeStream).on('close', () => {
      console.log(`file save to ${filepath}`)
    })
  })
}

downloadByUrl(sourceUrl, 'test.image')
