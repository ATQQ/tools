/* eslint-disable import/no-dynamic-require */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import { spawnSync } from 'child_process'
import path from 'path'
import { CLI_PLUGIN_KEY, defaultConfig } from '../constants'
import { delCLIConfig, getCLIConfig, pluginDir } from '../index'
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
