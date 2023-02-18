/* eslint-disable no-await-in-loop */
import fs from 'fs'
/* eslint-disable import/no-dynamic-require */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import { spawnSync, spawn } from 'child_process'
import path from 'path'
import { CLI_PLUGIN_KEY, defaultConfig } from '../constants'
import { delCLIConfig, getCLIConfig, pluginDir, readJSONFIle } from '../index'
import type { ICommandDescription, PluginDes } from '../types'

export function getInstalledPlugins(): ICommandDescription[] {
  const plugins: Record<string, PluginDes> = getCLIConfig(CLI_PLUGIN_KEY) || {}

  return Object.entries(plugins)
    .map(([pluginName, ops]) => {
      try {
        const module = loadCommandSync(ops)
        return module
      } catch (error) {
        console.log('=================================')
        console.log(pluginName, '加载失败')
        console.log(ops)
        console.log('已自动从配置中移除')
        console.log('=================================')
        delCLIConfig(`${CLI_PLUGIN_KEY}.${pluginName}`)
        return null as unknown as ICommandDescription
      }
    })
    .filter((v) => !!v)
}

export async function checkInstallEdPluginVersion(autoUpdate = true) {
  let update = false
  const plugins: Record<string, PluginDes> = getCLIConfig(CLI_PLUGIN_KEY) || {}
  for (const plugin of Object.values(plugins)) {
    if (plugin.local) {
      continue
    }
    const v = await pkgVersion(plugin.name)
    const nowVersion = readJSONFIle(plugin.packageJSON).version
    if (v !== nowVersion) {
      console.log('🚩', plugin.name, '有新版本版本', v, '可升级')
      update = true
      if (autoUpdate) {
        installRemotePlugin(
          `${plugin.name}@latest`,
          getCLIConfig('npm.registry') || defaultConfig.npm.registry
        )
        console.log('🚀', plugin.name, v, '升级完成')
      }
    }
  }
  if (!autoUpdate && update) {
    console.log('可执行', 'q update', '升级')
  }
  if (!update && autoUpdate) {
    console.log('所有插件都是最新 🎉')
  }
}

export function loadCommandSync(plugin: PluginDes): ICommandDescription {
  const { local, rest, name: pluginName } = plugin
  const module = local
    ? require(plugin.path)?.default
    : require(path.resolve(pluginDir, 'node_modules', pluginName))?.default

  if (typeof module === 'function') {
    return module(...rest)
  }
  return module
}

export function execCommand(command: string, rest: string[], cwd?: string) {
  return spawnSync(command, rest, {
    cwd: cwd || process.cwd()
  }).output.toString()
}

export function pkgExist(
  pkgName: string,
  registry = defaultConfig.npm.registry
) {
  const info = execCommand('npm', ['info', pkgName, `--registry=${registry}`])
  const exist = !(info.includes('404') && info.includes('ERR'))
  return exist && pkgName
}

export function spawnPromise(command: string, ...argv: any) {
  return new Promise((resolve, reject) => {
    const npmInfo = spawn(command, argv)
    npmInfo.stdout.on('data', (data) => {
      resolve(data.toString().trim())
    })
    npmInfo.stderr.on('data', (data) => {
      reject(data.toString().trim())
    })
  })
}

export function pkgVersion(
  pkgName: string,
  registry = defaultConfig.npm.registry
) {
  return spawnPromise(
    'npm',
    'info',
    pkgName,
    'version',
    `--registry=${registry}`
  )
}

export function syncFnErrorWrapper(fn: any, ...rest: any[]) {
  try {
    const res = fn(...rest)
    return res
  } catch (error: any) {
    console.log('===运行出现错误===')
    console.log(error.message)
    process.exit()
    return false
  }
}

export function getValidPkgName(installPkg: string) {
  const flag = installPkg.startsWith('@')
  return (flag ? '@' : '') + installPkg.slice(+flag).split('@')[0]
}

export const isLocal = (p: string) =>
  fs.existsSync(path.join(p, 'package.json'))

export function installLocalPlugin(localPath: string) {
  spawnSync('npm', ['link', localPath], {
    cwd: pluginDir
  })
}

export function installRemotePlugin(pluginName: string, registry: string) {
  spawnSync('npm', ['install', pluginName, `--registry=${registry}`], {
    cwd: pluginDir
  })
}
export function checkIsNpmPlugin(plugin: string) {
  const {
    registry = defaultConfig.npm.registry,
    scopePrefix = defaultConfig.npm.scopePrefix
  } = getCLIConfig('npm')
  const maybe = [...scopePrefix.map((v: string) => `${v}${plugin}`), plugin]
  const resPlugin = maybe.find((p) => pkgExist(p, registry))
  return resPlugin
}

export function initPluginsDir() {
  // 初始化目录
  if (!fs.existsSync(pluginDir)) {
    fs.mkdirSync(pluginDir, { recursive: true })
  }
  // 初始化 package.json
  if (!fs.existsSync(path.join(pluginDir, 'package.json'))) {
    spawnSync('npm', ['init', '-y'], {
      cwd: pluginDir
    })
  }
}
