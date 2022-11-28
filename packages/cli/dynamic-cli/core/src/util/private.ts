/* eslint-disable import/no-dynamic-require */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import path from 'path'
import { CLI_PLUGIN_KEY } from '../constants'
import { getCLIConfig, pluginDir } from '../index'
import type { ICommandDescription, PluginDes } from '../types'

export function getInstalledPlugins(): ICommandDescription[] {
  const plugins: Record<string, PluginDes> = getCLIConfig(CLI_PLUGIN_KEY) || {}

  return Object.entries(plugins).map(([pluginName, ops]) => {
    return loadCommandSync(pluginName, ops.rest)
  })
}

export function loadCommandSync(
  pluginName: string,
  rest: string[]
): ICommandDescription {
  const module = require(path.resolve(
    pluginDir,
    'node_modules',
    pluginName
  ))?.default

  if (typeof module === 'function') {
    return module(...rest)
  }
  return module
}
