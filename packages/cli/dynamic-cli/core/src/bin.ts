#!/usr/bin/env node

import { Command } from 'commander'
import definePlugin from '@sugarat/cli-plugin-config'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import moduleAlias from 'module-alias'
import path from 'path'
import pkg from '../package.json'
import { defaultConfig, globalConfigName } from './constants'
import {
  checkInstallEdPluginVersion,
  getInstalledPlugins,
  syncFnErrorWrapper
} from './util/private'
import { installCommand, removeCommand, updateCommand } from './command'

// 添加 alias
moduleAlias.addAlias('@sugarat/cli', path.join(__dirname, '../'))

const programInstance = new Command()
programInstance.version(pkg.version)

const init = (program: Command) => {
  const configPlugin = definePlugin(globalConfigName, defaultConfig)
  const inlinePlugin = [
    configPlugin,
    installCommand,
    removeCommand,
    updateCommand
  ]
  const installedPlugin = getInstalledPlugins()
  const plugins = [...inlinePlugin, ...installedPlugin]

  // 注册所有的指令
  plugins.forEach((p) => {
    try {
      p.command(program)
    } catch (error) {
      console.log('注册 command', p.name, '失败')
      console.log(error)
    }
  })

  checkInstallEdPluginVersion(false)
}

syncFnErrorWrapper(init, programInstance)

programInstance.parse(process.argv)
