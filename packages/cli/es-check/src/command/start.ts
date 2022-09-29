import glob from 'fast-glob'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import { checkFile, getEcmaVersion } from '../util'
import { FileError } from '../types'

interface Options {
  module?: boolean
  allowHashBang?: boolean
  exitCode?: string
  out?: string | boolean
}
export default function startCommand(
  ecmaVersionArg: string,
  filesArg: string[],
  options: Options
) {
  // 校验参数
  const ecmaVersion = getEcmaVersion(ecmaVersionArg)
  const sourceType = options.module ? 'module' : 'script'
  const { allowHashBang } = options
  const exitCode = +(options.exitCode || 1)
  if (!ecmaVersion) {
    console.error(
      'Invalid ecmaScript version, please pass a valid version(like es5), use --help for help'
    )
    process.exit(exitCode)
  }
  const files = filesArg && filesArg.length ? filesArg : []
  if (!files || !files.length) {
    console.error(
      'No files were passed in please pass in a list of files to es-check!(like dist/**/*.js dist/**/*.html)'
    )
    process.exit(exitCode)
  }
  let success = true
  ;(async () => {
    const ErrorList: FileError[] = []
    // check files
    for (const pattern of files) {
      const globbedFiles = glob.sync(pattern)
      for (const file of globbedFiles) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const esError = await checkFile(file, {
            ecmaVersion,
            sourceType,
            allowHashBang
          } as any)
          ErrorList.push(...esError)
        } catch (parseError) {
          console.error(
            `failed to parse file: ${file} \n - error: ${parseError}`
          )
          success = false
        }
      }
    }

    // print error info
    if (!success || ErrorList.length > 0) {
      const outFilename = options.out === true ? 'escheck.log' : options.out
      if (ErrorList.length > 0) {
        console.log(
          '!!!',
          chalk.yellowBright(`${ErrorList.length} errors`),
          '!!!'
        )
      }
      // 先清空旧文件内容
      if (outFilename) {
        fs.writeFileSync(outFilename, '', 'utf-8')
        console.log(
          'output log to:',
          chalk.green(path.join(process.cwd(), outFilename))
        )
      }
      ErrorList.forEach((err, idx) => {
        // 判断输出文件还是 console.log 打印
        const logInfo = `${chalk.red(`ERROR ${idx + 1}:`)}
        code: ${chalk.cyan(err.source)}
        at file: ${chalk.green(
          `${err.file}:${err.loc.start.line}:${err.loc.start.column}`
        )}${
          err.sourceMap
            ? `
        sourcemap code: ${chalk.cyan(err.sourceMap.source)}
        at sourcemap file: ${chalk.green(
          `${err.sourceMap.file}:${err.sourceMap.loc.start.line}:${err.sourceMap.loc.start.column}`
        )}
        `
            : '\n'
        }`
        if (outFilename) {
          fs.appendFileSync(outFilename, `${resetChalkStr(logInfo)}\n`, 'utf-8')
        } else {
          console.log(logInfo)
        }
      })
      process.exit(exitCode)
    }
    // success info
    console.log('ESCheck: there were no ES version matching errors!  🎉')
  })()
}

function ansiRegex({ onlyFirst = false } = {}) {
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'
  ].join('|')

  return new RegExp(pattern, onlyFirst ? undefined : 'g')
}

function resetChalkStr(str: string) {
  return str.replace(ansiRegex(), '')
}
