import {
  defineCommand,
  getCLIConfig,
  ICommandDescription,
  setCLIConfig
} from '@sugarat/cli'
import path from 'path'
import fs from 'fs'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ncp from 'copy-paste'
import { select } from '@clack/prompts'
import {
  createTempFile,
  currentWikiKey,
  currentWikiNum,
  formatWeeklyContent,
  getWeeklyTitle,
  isIncludeTargetPlatform,
  pipeCnBlogs,
  pipeJueJin,
  pipeMdNice,
  pipeWeekly,
  weeklyDirectoryKey
} from './util'
import { PLATFORM } from './type'

interface Option {
  weekly?: boolean
  format?: boolean
  create?: boolean
  type: PLATFORM
  output: boolean
  weeklyDir?: string
}
export default function definePlugin(): ICommandDescription {
  return defineCommand({
    name: 'blog',
    command(program) {
      program
        .command('blog [filepath]')
        .option('-c,--create', '创建文章模板', false)
        .option('-w,--weekly', '周刊格式转换', false)
        .option('--weekly-dir [dir]', '周刊目录')
        .option(
          '-f,--format',
          '格式化周刊文章内容(自动整理序号和描述信息)',
          false
        )
        .option(
          '-t,--type [type]',
          '导出的目标平台 (mdnice,juejin,cnblogs)',
          'mdnice'
        )
        .option('-o,--output', '输出的文件名')
        .description(`博客内容转换`)
        .action(async (filepath, ops: Option) => {
          if (!filepath && !(ops.create && ops.weekly)) {
            // 复用最近操作的文章
            filepath = getCLIConfig(currentWikiKey)
          }
          if (ops.weeklyDir) {
            // 设置周刊存放目录
            setCLIConfig(weeklyDirectoryKey, path.resolve(ops.weeklyDir))
            console.log('周刊目录设置成功', path.resolve(ops.weeklyDir))
            return
          }

          const { name, ext, dir } = path.parse(filepath || '')
          // 创建周刊文章模板
          if (ops.create && ops.weekly) {
            // 判断不是数字
            const currentNum = name || getCLIConfig(currentWikiNum)
            if (Number.isNaN(Number(currentNum))) {
              console.log('请输入数字作为周刊序号')
              return
            }
            setCLIConfig(currentWikiNum, Number(currentNum) + 1)
            createTempFile('weekly', { name: +currentNum + 1 })
            return
          }

          // ops 默认值处理
          if ((ops.type as unknown as boolean) === true) {
            const targetPlatform = await select({
              message: '选择目标平台',
              options: [
                { value: 'mdnice', label: '墨滴' },
                { value: 'juejin', label: '掘金' },
                { value: 'cnblogs', label: '博客园' }
              ]
            })
            if (!isIncludeTargetPlatform(targetPlatform as string)) {
              return
            }
            ops.type = targetPlatform as unknown as PLATFORM
          }

          const originPath = path.resolve(process.cwd(), filepath)
          const outputPath = path.resolve(
            process.cwd(),
            `${dir}/${name}_${ops.type}${ext}`
          )
          console.log('【pick】', originPath)

          if (!fs.existsSync(originPath)) {
            console.log('文件不存在')
            return
          }
          let content = fs.readFileSync(originPath, 'utf-8')

          const pipeline: ((v: string, type: PLATFORM) => string)[] = [
            pipeMdNice,
            pipeJueJin,
            pipeCnBlogs
          ]

          if (ops.weekly) {
            pipeline.unshift(pipeWeekly)

            if (ops.format) {
              // 自动修改源文件添加序号，描述等信息
              const newContent = formatWeeklyContent(content)
              if (newContent !== content) {
                fs.writeFileSync(originPath, newContent, 'utf-8')
                content = newContent
              }
            }
          }

          const result = pipeline.reduce((pre, pipe) => {
            return pipe(pre, ops.type)
          }, content)

          // 输出到文件
          if (ops.output) {
            fs.writeFileSync(outputPath, result)
            console.log('内容输出至', outputPath)
          }
          const targetPlatform = ops.type

          if (ops.weekly) {
            console.log(
              `【周刊标题】`,
              await getWeeklyTitle(originPath, targetPlatform)
            )
          }
          // 写入剪贴板
          ncp.copy(result, () => {
            console.log(`【${targetPlatform}】内容已写入剪贴板`)
          })
          // 更新配置
          setCLIConfig(currentWikiKey, originPath)
        })
    }
  })
}
