import { defineCommand, ICommandDescription } from '@sugarat/cli'
import { checkMachineEnv, checkServiceList } from './action'
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
        .option('--config [name]', '查看指定配置')
        .option('--list', '查看服务列表')
        .action(async (type: ActionType, options: Options) => {
          if (type === 'deploy') {
            await deployMenu()
            return
          }
          if (type === 'check') {
            await checkMachineEnv()
            return
          }

          if (type !== 'server') {
            return
          }
          if (options.list) {
            checkServiceList()
          }
          // const serverDir = validServerFile()
          // // serverName 和目录绑定
          // const serverList = getCLIConfig('server.list') || []
          // const serverInfoIdx = serverList.findIndex(
          //   (v: any) => v.dir === serverDir
          // )

          // const serverInfo = serverList[serverInfoIdx] || {}
          // if (!serverInfo.name) {
          //   serverInfo.dir = serverDir
          //   serverInfo.name = options.name || `ep-server-${Date.now()}`
          //   serverList.push(serverInfo)
          //   setCLIConfig('server.list', serverList)
          // }
          // if (options.name) {
          //   serverInfo.name = options.name
          // }

          // console.log('')
          // console.log('====操作服务信息====')
          // console.log('= dir:', serverInfo.dir)
          // console.log('= name:', serverInfo.name)
          // console.log('====================')
          // console.log('')

          // // 获取服务名
          // const serverName = serverInfo.name
          // if (options.config) {
          //   checkConfig(options.config)
          //   return
          // }

          // if (options.deploy) {
          //   // 校验目标文件和目录是否存在
          //   // 部署服务
          //   deployServer(serverName)
          //   return
          // }
          // if (options.restart) {
          //   restartService(serverName)
          //   return
          // }
          // if (options.stop) {
          //   stopService(serverName)
          //   return
          // }
          // if (options.del) {
          //   delCLIConfig(`server.list.${serverInfoIdx}`)
          //   deleteService(serverName)
          //   console.log('✅ 删除服务', serverName)
          //   return
          // }
          // if (options.status) {
          //   checkServiceStatus(serverName)
          //   return
          // }
          // if (options.log) {
          //   checkServiceLog(serverName)
          //   return
          // }
          // console.log('🎉 hello easypicker2 🎉')
        })
    }
  })
}
