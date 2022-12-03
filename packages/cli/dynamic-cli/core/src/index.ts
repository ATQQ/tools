import { getCRUDfn } from '@sugarat/cli-plugin-config'
import path from 'path'
import { globalConfigName, defaultConfig } from './constants'

const { getCLIConfig, setCLIConfig, delCLIConfig, configPath } = getCRUDfn(
  globalConfigName,
  defaultConfig
)

const pluginDir = path.join(path.parse(configPath).dir, 'plugins')

export { getCLIConfig, setCLIConfig, delCLIConfig, configPath, pluginDir }
export * from './types'
export * from './util/index'
