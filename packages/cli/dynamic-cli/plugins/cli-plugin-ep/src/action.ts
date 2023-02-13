import { readJSONFIle } from '@sugarat/cli'
import { exec, execSync } from 'child_process'
import path from 'path'

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

export function packDist(mode: string, type: string) {
  const pkgJSON = readJSONFIle(path.resolve(process.cwd(), 'package.json'))
  const compressPkgName = `${type}_${mode}_${pkgJSON.name}_${pkgJSON.version}.tar.gz`
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
  // TODO:上传逻辑
  // TODO: OSS Key的路径逻辑参考一下社区先
  console.log('上传文件', filename)
}
