import { defineCommand, ICommandDescription } from '@sugarat/cli'
import { inspect } from 'util'
import { ConfigType } from './types'
import { getCRUDfn } from './util'

export default function definePlugin(
  configName = '.sugaratrc'
): ICommandDescription {
  const { setCLIConfig, delCLIConfig, getCLIConfig } = getCRUDfn(configName)
  return defineCommand({
    name: 'config',
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
