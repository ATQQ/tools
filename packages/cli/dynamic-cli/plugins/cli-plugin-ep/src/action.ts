import { readJSONFIle, getCLIConfig } from '@sugarat/cli'
import { exec, execSync } from 'child_process'
import path from 'path'
import qiniu from 'qiniu'
import fs from 'fs'
import axios from 'axios'
import { intro, outro, spinner, cancel } from '@clack/prompts'
import chalk from 'chalk'
import { promisify } from 'util'
import semver from 'semver'

const execAsync = promisify(exec)
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

function checkNodeVersion() {
  const nodeVersionSpinner = spinner()
  nodeVersionSpinner.start('🔍 检查Node版本')
  const nodeVersion = process.version.replace('v', '')
  if (semver.cmp(nodeVersion, '>=', '16.0.0')) {
    nodeVersionSpinner.stop(`✅ Node版本 ${nodeVersion}`)
  } else {
    cancel('Node 版本需要 >= 16')
    return process.exit(0)
  }
}

async function checkRegistry() {
  const registrySpinner = spinner()
  registrySpinner.start('🔍 检查 npm 镜像源')
  await execAsync('npm config set registry https://registry.npmmirror.com/', {
    cwd: process.cwd()
  })
  registrySpinner.stop('✅ 设置 npm 镜像源 : https://registry.npmmirror.com/')
}

async function checkPNPM() {
  const pnpmSpinner = spinner()
  pnpmSpinner.start('🔍 检查pnpm是否安装')
  const { stderr } = await execAsync('pnpm -v', {
    cwd: process.cwd()
  })

  if (stderr) {
    pnpmSpinner.stop('❌ pnpm未安装')
    cancel(
      `请执行 ${chalk.green(
        'npm i -g pnpm --registry=https://registry.npmmirror.com'
      )} 安装pnpm`
    )
    return process.exit(0)
  }
  pnpmSpinner.stop('✅ pnpm已安装')
}
export async function checkMachineEnv() {
  console.log()
  intro(chalk.inverse(' 检查环境配置情况 '))

  await checkNodeVersion()

  await checkRegistry()

  await checkPNPM()

  outro(`完成检查`)
}
export const CompressPkgName = (type: string, version: string) => {
  return `EasyPicker_${type}_${version}.tar.gz`
}
export function initMysql(dbName: string, user: string, password: string) {
  execSync(
    `curl https://script.sugarat.top/shell/ep/init-db.sh | bash -s ${dbName} ${user} ${password}`,
    {
      cwd: process.cwd(),
      stdio: 'inherit'
    }
  )
}

export function packDist(type: string) {
  const pkgJSON = readJSONFIle(path.resolve(process.cwd(), 'package.json'))
  const compressPkgName = CompressPkgName(type, pkgJSON.version)

  if (fs.existsSync(path.join(process.cwd(), compressPkgName))) {
    fs.rmSync(path.join(process.cwd(), compressPkgName))
  }

  execSync(`tar -zvcf ${compressPkgName} package.json .env dist`, {
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
  console.log('🔧 准备拉取资源包')
  const { versionMapUrl, cdn } = getCLIConfig('qiniu.source')

  // 取远程配置
  const versionMap = (await axios.get(versionMapUrl)).data

  // 取版本号
  const targetVersion = versionMap[version] || version
  const pkgName = CompressPkgName(type, targetVersion)
  // 生成key路径
  const sourceUrl = `${cdn}/${getCLIConfig(
    'qiniu.base'
  )}${targetVersion}/${pkgName}`

  try {
    const result = await axios.get(sourceUrl, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      responseType: 'arraybuffer'
    })
    // 保存资源到本地
    fs.writeFileSync(pkgName, result.data, 'binary')
    console.log('✅ 资源包已拉取到本地', pkgName)
  } catch (error: any) {
    console.log(error?.message)
    console.log('❌ 资源不存在')
    process.exit(0)
  }
  return pkgName
}

export async function getCompressName(
  type: string,
  version: string,
  existName?: string
) {
  if (existName && fs.existsSync(path.resolve(process.cwd(), existName))) {
    return existName
  }
  const { versionMapUrl } = getCLIConfig('qiniu.source')
  // 取远程配置
  const versionMap = (await axios.get(versionMapUrl)).data

  // 取版本号
  const targetVersion = versionMap[version] || version
  const pkgName = CompressPkgName(type, targetVersion)
  return pkgName
}

export async function unPkg(type: string, version: string, existName?: string) {
  const pkgName = await getCompressName(type, version, existName)

  const targetDir = path.resolve(
    process.cwd(),
    type === 'client' ? './' : 'easypicker2-server'
  )

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  execSync(`tar -xf ${pkgName} -C ${targetDir}`, {
    stdio: 'ignore',
    cwd: process.cwd()
  })
  console.log('✅ 资源包已解压', pkgName)
}
export function validServerFile() {
  console.log('🔍 正在检查相关文件是否完整')
  const targetDir = path.resolve(process.cwd(), 'easypicker2-server')
  if (
    !fs.existsSync(path.join(targetDir, 'dist/index.js')) ||
    !fs.existsSync(path.join(targetDir, 'package.json'))
  ) {
    console.log('❌ 服务端文件不存在', targetDir)
    process.exit(0)
  }

  // console.log('🔧 正在进行pnpm依赖安装，请稍等')

  // 切换到淘宝镜像源
  execSync(`npm config set registry https://registry.npmmirror.com/`, {
    stdio: 'ignore',
    cwd: targetDir
  })

  // 安装依赖
  execSync(`pnpm install`, {
    stdio: 'ignore',
    cwd: targetDir
  })

  return targetDir
}

export function deleteService(serverName: string) {
  // 删除旧的
  try {
    execSync(`pm2 delete ${serverName}`, {
      stdio: 'ignore',
      cwd: process.cwd()
    })
  } catch (error) {
    // TODO：更友好的处理
    console.log()
  }
}

export async function runService(serverName: string) {
  // 启动
  try {
    execSync(
      `cd easypicker2-server && pm2 start npm --name ${serverName} -- run start`,
      {
        stdio: 'ignore',
        cwd: process.cwd()
      }
    )
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((res) => setTimeout(res, 2000))
    execSync(
      `tail -n8 ${path.join(
        process.env.HOME || process.env.USERPROFILE || process.cwd(),
        '.pm2/logs',
        `${serverName}-out.log`
      )}`,
      {
        stdio: 'inherit',
        cwd: process.cwd()
      }
    )
    console.log('✅ 服务启动成功', serverName)
    console.log('可以使用 q ep server --status 查看服务状态')
    console.log('可以使用 q ep server --log 查看服务日志')
  } catch (error) {
    console.log('❌ 服务启动失败')
  }
}

export function restartService(serverName: string) {
  try {
    execSync(`pm2 restart ${serverName}`, {
      stdio: 'ignore',
      cwd: process.cwd()
    })
  } catch (error) {
    console.log('❌ 服务重启失败')
    return
  }
  console.log('✅ 服务重启成功')
}

export function stopService(serverName: string) {
  try {
    execSync(`pm2 stop ${serverName}`, {
      stdio: 'ignore',
      cwd: process.cwd()
    })
  } catch (error) {
    console.log('❌ 停止服务失败')
    return
  }
  console.log(`✅ 已停止服务${serverName}`)
}
export function checkServiceStatus(serverName: string) {
  execSync(`pm2 monit ${serverName}`, {
    stdio: 'inherit',
    cwd: process.cwd()
  })
}
export function checkServiceLog(serverName: string) {
  execSync(`pm2 logs ${serverName} --out`, {
    stdio: 'inherit',
    cwd: process.cwd()
  })
}
export function deployServer(serverName: string) {
  deleteService(serverName)
  runService(serverName)
}
export function checkServiceList() {
  const serviceList = getCLIConfig('server.list')
  console.log(serviceList)
}
export async function deployPkg(type: string, version: string) {
  const pkgName = await pullPkg(type, version)
  await unPkg(type, version, pkgName)
}

export async function checkConfig(type: string) {
  const cyanColor = (str: string) => `[36m${str}[39m`
  try {
    const userData = readJSONFIle(
      path.join(process.cwd(), 'easypicker2-server', 'user-config.json')
    )
    if (!type) {
      console.log(
        `你应该在执行脚本后添加 ${cyanColor('<type>')} 参数，支持如下值`
      )
      console.log([...new Set(userData.map((v: any) => v.type))])
      console.log('例如', cyanColor('q ep --config user'))
      process.exit(1)
    }
    const getTypeObj = (_type: string) =>
      userData
        .filter((v: any) => v.type === _type)
        .reduce((pre: any, cur: any) => {
          pre[cur.key] = cur.value
          return pre
        }, {})
    console.table(getTypeObj(type))
  } catch (error) {
    console.log('❌', '目标目录下不存在 user-config.json 文件')
  }
}
