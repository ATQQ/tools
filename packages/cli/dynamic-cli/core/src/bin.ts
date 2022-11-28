#!/usr/bin/env node

import { Command } from 'commander'
import definePlugin from '@sugarat/cli-plugin-config'
import pkg from '../package.json'
import { globalConfigName } from './constants'
import { getInstalledPlugins } from './util/private'
import { installCommand } from './command'

const program = new Command()
program.version(pkg.version)

const configPlugin = definePlugin(globalConfigName)
const inlinePlugin = [configPlugin, installCommand]
const installedPlugin = getInstalledPlugins()
const plugins = [...inlinePlugin, ...installedPlugin]

// 注册所有的指令
plugins.forEach((p) => {
  try {
    p.command(program)
  } catch (error) {
    console.log('register command', p.name, 'fail')
    console.log(error)
  }
})

program.parse(process.argv)
