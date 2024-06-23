import { readJSONFIle, getCLIConfig } from '@sugarat/cli'
import { exec } from 'child_process'
import path from 'path'
import {
  intro,
  outro,
  spinner,
  cancel,
  select,
  isCancel,
  text,
  confirm
} from '@clack/prompts'
import chalk from 'chalk'
import { promisify } from 'util'
import semver from 'semver'
import fs from 'fs'
import { getDefaultUserConfig, sleep } from './util'
import { TypeMap } from './constants'

const execAsync = promisify(exec)

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

  await checkUserConfig()

  await checkRegistry()

  await checkPNPM()

  outro(`完成检查`)
}
export async function checkUserConfig() {
  const userConfigPath = path.resolve(
    process.cwd(),
    'easypicker2-server/user-config.json'
  )
  const userCfgSpinner = spinner()
  userCfgSpinner.start('🔍 检查用户配置')
  // 不存在则创建目录
  const dir = path.dirname(userConfigPath)
  if (!fs.existsSync(dir)) {
    userCfgSpinner.message('创建 easypicker2-server 目录')
    fs.mkdirSync(dir, { recursive: true })
    await sleep(1000)
  }

  // 不存在则创建文件
  if (!fs.existsSync(userConfigPath)) {
    userCfgSpinner.message('创建 user-config.json 文件')
    // 写入默认的内容
    fs.writeFileSync(
      userConfigPath,
      JSON.stringify(getDefaultUserConfig(), null, 2)
    )
    await sleep(1000)
  }
  userCfgSpinner.stop('✅ 完成 user-config.json 检查')
}

async function checkServiceList() {
  const serviceList = getCLIConfig('server.list')
  console.log(`========= ${chalk.green('CLI记录列表')} =========`)
  console.table(serviceList)
  console.log(`========= ${chalk.green('pm2 list')} =========`)
  const { stdout } = await execAsync('pm2 list', {
    cwd: process.cwd()
  })
  console.log(stdout)
}

async function checkConfig() {
  const userConfigPath = path.resolve(
    process.cwd(),
    'easypicker2-server/user-config.json'
  )
  if (!fs.existsSync(userConfigPath)) {
    cancel(`不存在 user-config.json 文件 ${userConfigPath}`)
    return process.exit(0)
  }
  const userConfig = readJSONFIle(userConfigPath)
  const types = [
    ...new Set(userConfig.map((item: any) => item.type))
  ] as string[]

  const type = await select({
    message: '请选择配置类型',
    options: types.map((item) => ({
      value: item,
      label: `${TypeMap[item as keyof typeof TypeMap]}- ${item}`
    }))
  })

  if (isCancel(type)) {
    cancel('取消')
    return process.exit(0)
  }
  const filterConfig = userConfig
    .filter((item: any) => item.type === type)
    .map((v: any) => ({
      key: v.key,
      value: v.value
    }))
  console.log(`========= ${chalk.green(type)} 配置详情 =========`)
  console.table(filterConfig)
}

async function rewriteConfig() {
  const userConfigPath = path.resolve(
    process.cwd(),
    'easypicker2-server/user-config.json'
  )

  if (!fs.existsSync(userConfigPath)) {
    cancel(`不存在 user-config.json 文件 ${userConfigPath}`)
    return process.exit(0)
  }
  const userConfig = readJSONFIle(userConfigPath)
  const types = [
    ...new Set(userConfig.map((item: any) => item.type))
  ] as string[]

  const type = await select({
    message: '请选择要修改的配置（无需修改的配置项 - 直接回车确认即可）',
    options: types.map((item) => ({
      value: item,
      label: `${TypeMap[item as keyof typeof TypeMap]}- ${item}`
    }))
  })
  if (isCancel(type)) {
    cancel('取消')
    return process.exit(0)
  }
  const filterConfig = userConfig.filter((item: any) => item.type === type)
  for (const cfg of filterConfig) {
    const newValue = await text({
      message: `重新设置${cfg.type}.${cfg.key}值`,
      initialValue: `${cfg.value || ''}`
    })
    if (isCancel(newValue)) {
      cancel('取消')
      return process.exit(0)
    }
    cfg.value = newValue || ''
  }
  const confirmRewrite = await confirm({
    message: `确认修改${type}配置？`,
    initialValue: true
  })
  if (isCancel(confirmRewrite) || !confirmRewrite) {
    cancel('取消')
    return process.exit(0)
  }

  fs.writeFileSync(userConfigPath, JSON.stringify(userConfig, null, 2))
}
export async function checkService() {
  console.log()
  intro(chalk.inverse(' 检查服务相关配置 '))

  const operator = await select({
    message: '请选择操作',
    options: [
      { value: 'config', label: '查看配置' },
      { value: 'rewrite', label: '修改配置' },
      { value: 'list', label: '服务列表' }
    ]
  })
  if (isCancel(operator)) {
    cancel('取消')
    return process.exit(0)
  }

  if (operator === 'list') {
    await checkServiceList()
  }
  if (operator === 'config') {
    await checkConfig()
  }
  if (operator === 'rewrite') {
    await rewriteConfig()
    outro(`✅ 配置修改完成，重启后端服务后生效`)
    return
  }
  outro(`bye bye ^_^ ✋🏻`)
}
