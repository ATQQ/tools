// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { defineCommand } from '@sugarat/cli'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { ICommandDescription } from '@sugarat/cli'
import { inspect } from 'util'
import { ConfigType } from './types'
import { getCRUDfn } from './util'

export default function definePlugin(
  configName = '.sugaratrc',
  defaultConfig: Record<string, any> = {}
): ICommandDescription {
  const { setCLIConfig, delCLIConfig, getCLIConfig } = getCRUDfn(
    configName,
    defaultConfig
  )
  return defineCommand({
    name: 'config',
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    command(program) {
      program
        .command('config <type> [key] [value]')
        .description(
          `crud cli config( ~/${configName} ) <type> in [get,set,del,ls]`
        )
        .action((type: ConfigType, key: string, value: string) => {
          if (type === 'set') {
            setCLIConfig(key, value)
          }
          if (type === 'del') {
            delCLIConfig(key)
          }
          if (type === 'get') {
            console.log(getCLIConfig(key) || '')
          }
          if (type === 'ls') {
            console.log(inspect(getCLIConfig(), true, Infinity))
          }
        })
    },
    configName
  })
}

export * from './util'
export * from './types'
