import type { Command } from 'commander'

export type ICommand = Command

export type RegistryCommandFn = (commanderInstance: ICommand) => void

export interface ICommandDescription extends Record<string, any> {
  /**
   * 实现command逻辑
   */
  command: RegistryCommandFn
  /**
   * 指令名称，避免重复，防止插件之前相互覆盖
   */
  name: string
}

export interface PluginDes {
  local: boolean
  rest: string[]
  packageJSON: string
  path: string
  name: string
}
