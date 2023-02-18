import { defineCommand } from '../util'
import { checkInstallEdPluginVersion } from '../util/private'

export const updateCommand = defineCommand({
  name: 'update',
  command(program) {
    program
      .command('update')
      .description('update all command')
      .action(async () => {
        await checkInstallEdPluginVersion()
      })
  }
})
