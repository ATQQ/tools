import path from 'path'
import { defineCommand, readJSONFIle } from '../util'
import { delCLIConfig } from '../index'
import type { PluginDes } from '../types/index'
import { CLI_PLUGIN_KEY } from '../constants'
import { isLocal, checkIsNpmPlugin } from '../util/private'

export const removeCommand = defineCommand({
  name: 'remove',
  command(program) {
    program
      .command('remove <plugin>')
      .alias('del')
      .description('remove a exist command')
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
        console.log('完成', pluginDes.name, '移除')
        // 更新配置文件记录
        delCLIConfig(`${CLI_PLUGIN_KEY}.${pluginDes.name}`)
      })
  }
})
