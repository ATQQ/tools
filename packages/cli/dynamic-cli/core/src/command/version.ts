import path from 'path'
import { defineCommand, readJSONFIle } from '../util'
import { getCLIConfig } from '../index'
import type { PluginDes } from '../types/index'
import { CLI_PLUGIN_KEY } from '../constants'
import { isLocal, checkIsNpmPlugin } from '../util/private'

export const versionCommand = defineCommand({
  name: 'version',
  command(program) {
    program
      .command('version <plugin>')
      .alias('v')
      .description('check command version')
      .action(async (plugin: string, rest: string[] = []) => {
        const pluginDes: PluginDes = {
          local: false,
          rest,
          packageJSON: '',
          path: '',
          name: ''
        }
        if (isLocal(plugin)) {
          pluginDes.local = true
          // 记录目标插件的信息
          pluginDes.packageJSON = path.join(plugin, 'package.json')
          pluginDes.path = plugin
          pluginDes.name = readJSONFIle(pluginDes.packageJSON).name || ''
          // eslint-disable-next-line no-cond-assign
        } else {
          pluginDes.name = checkIsNpmPlugin(plugin)
        }
        if (!pluginDes.name) {
          console.log('指定的插件不存在')
          return
        }

        // 更新配置文件记录
        const info = getCLIConfig(`${CLI_PLUGIN_KEY}.${pluginDes.name}`)
        console.log(readJSONFIle(info.packageJSON).version)
      })
  }
})
