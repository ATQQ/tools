import {
  defineCommand,
  ICommandDescription,
  getCLIConfig,
  setCLIConfig
} from '@sugarat/cli'
import {
  checkMachineEnv,
  deployPkg,
  packDist,
  pullPkg,
  unPkg,
  uploadPkg
} from './action'
import type { ActionType, Options } from './type'

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
        .option('--deploy [version]', '一键部署资源包')
        .option('--name <serverName>', '指定服务应用的名称')
        .option('--restart', '重启服务')
        .option('--start', '启动服务')
        .option('--stop', '启动服务')
        .option('--del', '移除服务')
        .option('--status', '服务状态')
        .option('--log', '服务日志')
        .action((type: ActionType, options: Options) => {
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
          }
          if (!type) {
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

          const serverName =
            options.name ||
            getCLIConfig('server.name') ||
            `ep-server_${Date.now()}`

          setCLIConfig('server.name', serverName)

          if (options.deploy) {
            deployPkg(
              type,
              options.deploy === true ? 'latest' : options.deploy,
              serverName
            )
            return
          }
          console.log('🎉 hello easypicker2 🎉')
        })
    }
  })
}
