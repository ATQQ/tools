import { defineCommand, ICommandDescription } from '@sugarat/cli'
import { checkMachineEnv, checkService } from './action'
import type { ActionType, Options } from './type'
import { deployMenu } from './menu/deploy'

export default function definePlugin(): ICommandDescription {
  return defineCommand({
    name: 'ep',
    command(program) {
      program
        .command('ep [type]')
        .description(
          `部署兼启动 EasyPicker 服务 (type in [deploy, check, server])`
        )
        .action(async (type: ActionType, options: Options) => {
          if (type === 'deploy') {
            await deployMenu()
            return
          }
          if (type === 'check') {
            await checkMachineEnv()
            return
          }
          if (type === 'server') {
            await checkService()
          }
        })
    }
  })
}
