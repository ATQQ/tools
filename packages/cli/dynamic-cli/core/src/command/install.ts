import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { defineCommand, readJSONFIle } from '../util'
import { getCLIConfig, setCLIConfig, pluginDir } from '../index'
import type { PluginDes } from '../types/index'
import { CLI_PLUGIN_KEY } from '../constants'
import { loadCommandSync } from '../util/private'

const isLocal = (p: string) => fs.existsSync(path.join(p, 'package.json'))
const getRegistry = () =>
  getCLIConfig('npm.registry') || 'https://registry.npmmirror.com/'

function installLocalPlugin(localPath: string) {
  spawnSync('npm', ['link', localPath], {
    cwd: pluginDir
  })
}
function initPluginsDir() {
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

export const installCommand = defineCommand({
  name: 'install',
  command(program) {
    program
      .command('install [plugin] [rest...]')
      .description('install a new command')
      .action((plugin: string, rest: string[] = []) => {
        const pluginDes: PluginDes = {
          local: false,
          rest,
          packageJSON: '',
          path: '',
          name: ''
        }
        // 初始化一些东西
        initPluginsDir()
        if (isLocal(plugin)) {
          installLocalPlugin(plugin)
          pluginDes.local = true
          // 记录目标插件的信息
          pluginDes.packageJSON = path.join(plugin, 'package.json')
          pluginDes.path = plugin
        }
        if (pluginDes.packageJSON) {
          pluginDes.name = readJSONFIle(pluginDes.packageJSON).name || ''
        }

        // 输出帮助信息
        if (!pluginDes.name) {
          console.log('无效插件!!!')
          return
        }
        const p = loadCommandSync(pluginDes.name, pluginDes.rest)
        // 打印安装的指令
        console.log('完成', p.name, '指令安装')
        console.log('执行', 'q', p.name, '--help', '查看细节')
        // 更新配置文件记录
        setCLIConfig(`${CLI_PLUGIN_KEY}.${pluginDes.name}`, pluginDes)
      })
  }
})
