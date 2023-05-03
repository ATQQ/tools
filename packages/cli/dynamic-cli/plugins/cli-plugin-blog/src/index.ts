import { defineCommand, ICommandDescription } from '@sugarat/cli'
import path from 'path'
import fs from 'fs'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ncp from 'copy-paste'
import { formatWeeklyContent, pipeJueJin, pipeMdNice, pipeWeekly } from './util'
import { PLATFORM } from './type'

interface Option {
  weekly?: boolean
  format?: boolean
  type: PLATFORM
  output: boolean
}
export default function definePlugin(): ICommandDescription {
  return defineCommand({
    name: 'blog',
    command(program) {
      program
        .command('blog <file>')
        .option('-w,--weekly', '周刊格式转换', false)
        .option(
          '-f,--format',
          '格式化周刊文章内容(自动整理序号和描述信息)',
          false
        )
        .option('-t,--type <type>', '导出的目标平台 (mdnice,juejin)', 'mdnice')
        .option('-o,--output', '输出的文件名')
        .description(`博客内容转换`)
        .action((filepath, ops: Option) => {
          const { name, ext, dir } = path.parse(filepath)

          const originPath = path.resolve(process.cwd(), filepath)
          const outputPath = path.resolve(
            process.cwd(),
            `${dir}/${name}_${ops.type}${ext}`
          )

          let content = fs.readFileSync(originPath, 'utf-8')

          const pipeline: ((v: string, type: PLATFORM) => string)[] = [
            pipeMdNice,
            pipeJueJin
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

          // 写入剪贴板
          ncp.copy(result, () => {
            console.log('内容已写入剪贴板')
          })
        })
    }
  })
}
