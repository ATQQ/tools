import {
  defineCommand,
  ICommandDescription,
  getCLIConfig,
  setCLIConfig,
  delCLIConfig
} from '@sugarat/cli'
import {
  checkMachineEnv,
  checkServiceStatus,
  deleteService,
  deployPkg,
  packDist,
  pullPkg,
  restartService,
  stopService,
  unPkg,
  uploadPkg,
  checkServiceLog,
  validServerFile,
  deployServer,
  checkServiceList,
  checkConfig,
  initMysql
} from './action'
import type { ActionType, Options } from './type'
import { deployMenu } from './menu/deploy'

export default function definePlugin(): ICommandDescription {
  return defineCommand({
    name: 'ep',
    command(program) {
      program
        .command('ep [type]')
        .description(
          `部署兼启动 EasyPicker 服务 (type in [client, server, admin])`
        )
        .option('--check', '检查环境')
        .option('-p,--pack', '产物打包')
        .option('-u,--upload', '上传打包的产物')
        .option('--pull [version]', '拉取服务静态资源')
        .option('--unpkg [version]', '解压资源包')
        .option('--deploy [version]', '一键部署服务')
        .option('--init-mysql <rest...>', '一键导入数据库表')
        .option('--name <serverName>', '指定服务应用的名称')
        .option('--stop', '停止服务')
        .option('--config [name]', '获取指定配置')
        .option('--restart', '重启服务')
        .option('--del', '移除服务')
        .option('--status', '服务状态')
        .option('--log', '服务日志')
        .option('--list', '服务列表')
        .action(async (type: ActionType, options: Options) => {
          if (!getCLIConfig('qiniu.base')) {
            setCLIConfig('qiniu.base', `dist/easypicker/`)
          }

          if (!getCLIConfig('qiniu.source')) {
            setCLIConfig('qiniu.source', {
              versionMapUrl: 'https://script.sugarat.top/json/ep-version.json',
              cdn: 'https://img.cdn.sugarat.top'
            })
          }

          if (options.check) {
            checkMachineEnv()
            return
          }
          if (options.initMysql) {
            if (options.initMysql?.length !== 3) {
              console.log('❌ 传入的数据库参数格式不正确')
              return
            }
            const [dbName, dbUser, dbPassword] = options.initMysql
            initMysql(dbName, dbUser, dbPassword)
            return
          }
          if (!type) {
            if (options.deploy) {
              await deployMenu()
            }
            return
          }
          if (options.pack) {
            const filename = packDist(type)
            if (options.upload) {
              uploadPkg(filename).catch((err) => {
                console.log(err?.message)
              })
            }
            return
          }
          if (options.pull) {
            pullPkg(type, options.pull === true ? 'latest' : options.pull)
            return
          }
          if (options.unpkg) {
            unPkg(type, options.unpkg === true ? 'latest' : options.unpkg)
            return
          }

          if (options.deploy) {
            await deployPkg(
              type,
              options.deploy === true ? 'latest' : options.deploy
            )
          }
          if (type !== 'server') {
            return
          }
          if (options.list) {
            checkServiceList()
            return
          }
          const serverDir = validServerFile()
          // serverName 和目录绑定
          const serverList = getCLIConfig('server.list') || []
          const serverInfoIdx = serverList.findIndex(
            (v: any) => v.dir === serverDir
          )

          const serverInfo = serverList[serverInfoIdx] || {}
          if (!serverInfo.name) {
            serverInfo.dir = serverDir
            serverInfo.name = options.name || `ep-server-${Date.now()}`
            serverList.push(serverInfo)
            setCLIConfig('server.list', serverList)
          }
          if (options.name) {
            serverInfo.name = options.name
          }

          console.log('')
          console.log('====操作服务信息====')
          console.log('= dir:', serverInfo.dir)
          console.log('= name:', serverInfo.name)
          console.log('====================')
          console.log('')

          // 获取服务名
          const serverName = serverInfo.name
          if (options.config) {
            checkConfig(options.config)
            return
          }

          if (options.deploy) {
            // 校验目标文件和目录是否存在
            // 部署服务
            deployServer(serverName)
            return
          }
          if (options.restart) {
            restartService(serverName)
            return
          }
          if (options.stop) {
            stopService(serverName)
            return
          }
          if (options.del) {
            delCLIConfig(`server.list.${serverInfoIdx}`)
            deleteService(serverName)
            console.log('✅ 删除服务', serverName)
            return
          }
          if (options.status) {
            checkServiceStatus(serverName)
            return
          }
          if (options.log) {
            checkServiceLog(serverName)
            return
          }
          console.log('🎉 hello easypicker2 🎉')
        })
    }
  })
}
