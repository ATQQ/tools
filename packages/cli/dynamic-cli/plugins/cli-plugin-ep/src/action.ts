import { readJSONFIle, getCLIConfig } from '@sugarat/cli'
import { exec, execSync } from 'child_process'
import path from 'path'
import qiniu from 'qiniu'
import fs from 'fs'
import axios from 'axios'

export function isCmdExist(
  cmd: string,
  ops?: {
    name?: string
    installCommand?: string
    tip?: string
  }
) {
  const { name, installCommand, tip } = ops || {}
  const softwareName = name || cmd
  return new Promise((resolve, reject) => {
    exec(`command -v ${cmd}`, (err, stdout, stderr) => {
      if (err) {
        console.log(`❌ ${softwareName}`)
        if (!installCommand) {
          console.log(`💡 ${tip || `请手动安装 ${softwareName}`}`)
          reject()
          return
        }
        console.log(`🔧 准备安装 ${softwareName}`)

        execSync(installCommand, {
          stdio: 'inherit',
          cwd: process.cwd()
        })
        console.log(`✅ 安装完成 ${softwareName}`)
        resolve(true)
        return
      }
      console.log(`✅ ${softwareName}`)
      resolve(true)
    })
  })
}

export function checkRegistry() {
  const res = execSync('npm get registry', { encoding: 'utf-8' }).trim()
  const taobaoRegistry = 'https://registry.npmmirror.com/'
  if (res !== taobaoRegistry) {
    console.log('❌ taobao registry')
    console.log('🔧 切换淘宝镜像源')
    execSync('nrm use taobao')
  }
  console.log('✅ taobao registry')
}

export async function checkMachineEnv() {
  await isCmdExist('zx', {
    installCommand: 'npm i -g zx --registry=https://registry.npmmirror.com'
  })
  await isCmdExist('node', {
    tip: '请安装Node 且版本需要大于 14.19（宝塔面板推荐使用 PM2进行安装）'
  })
  await isCmdExist('nrm', {
    installCommand: 'npm i -g nrm --registry=https://registry.npmmirror.com'
  })
  await isCmdExist('pnpm', {
    tip: '请执行如下指令安装: npm i -g pnpm'
  })
  checkRegistry()
}
export const CompressPkgName = (type: string, version: string) => {
  return `EasyPicker_${type}_${version}.tar.gz`
}

export function packDist(type: string) {
  const pkgJSON = readJSONFIle(path.resolve(process.cwd(), 'package.json'))
  const compressPkgName = CompressPkgName(type, pkgJSON.version)

  if (fs.existsSync(path.join(process.cwd(), compressPkgName))) {
    fs.rmSync(path.join(process.cwd(), compressPkgName))
  }

  execSync(`tar -zvcf ${compressPkgName} package.json dist`, {
    stdio: 'ignore',
    cwd: process.cwd()
  })
  console.log(`✅ 产物归档完成`)
  execSync(`du -h ${compressPkgName}`, {
    stdio: 'inherit',
    cwd: process.cwd()
  })
  return compressPkgName
}

export function uploadPkg(filename: string) {
  const pkgJSON = readJSONFIle(path.resolve(process.cwd(), 'package.json'))

  return new Promise((resolve, reject) => {
    console.log('🔧 正在上传文件', filename)
    const qiniuConfig = getCLIConfig('qiniu')
    const {
      bucket,
      accessKey,
      secretKey,
      base = `dist/easypicker/`
    } = qiniuConfig || {}
    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: bucket
    })
    const uploadToken = putPolicy.uploadToken(mac)

    const config = new qiniu.conf.Config({
      // 空间对应的机房
      zone: qiniu.zone.Zone_z0,
      useCdnDomain: true
    })
    const localFile = path.resolve(process.cwd(), filename)

    const formUploader = new qiniu.form_up.FormUploader(config)
    const putExtra = new qiniu.form_up.PutExtra()
    const key = `${base}${pkgJSON?.version || 'unknown'}/${filename}`
    // 七牛云文件上传
    formUploader.putFile(
      uploadToken,
      key,
      localFile,
      putExtra,
      (respErr, respBody, respInfo) => {
        if (respErr) {
          console.log('❌ 文件上传出错', filename)
          reject(respErr)
          throw respErr
        }
        if (respInfo.statusCode === 200) {
          // console.log(respBody)
          resolve(respInfo)
          console.log('✅ 资源上传成功', key)
        } else {
          console.log('❌ 文件上传失败', filename)
          reject(respInfo)
          // console.log(respInfo.statusCode)
          // console.log(respBody)
        }
      }
    )
  })
}

export async function pullPkg(type: string, version: string) {
  const { versionMapUrl, cdn } = getCLIConfig('qiniu.source')

  // 取远程配置
  const versionMap = (await axios.get(versionMapUrl)).data

  // 取版本号
  const targetVersion = versionMap[version] || version

  // 生成key路径
  const sourceUrl = `${cdn}/${getCLIConfig(
    'qiniu.base'
  )}${targetVersion}/${CompressPkgName(type, targetVersion)}`
  console.log(sourceUrl)

  // TODO: 判断是否存在
  const result = await axios.get(sourceUrl, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    responseType: 'arraybuffer'
  })
  // console.log(result.);

  // 保存资源到本地
}
