import glob from 'fast-glob'
import { checkFile, getEcmaVersion } from '../util'
import { FileError } from '../types'

interface Options {
  module?: boolean
  allowHashBang?: boolean
  exitCode?: string
  out?: string
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
        } catch (parseError) {
          console.error(
            `failed to parse file: ${file} \n - error: ${parseError}`
          )
          success = false
        }
      }
    }
    if (!success || ErrorList.length > 0) {
      // TODO:判断输出文件还是 console.log 打印
      process.exit(exitCode)
    }
  })()
}
