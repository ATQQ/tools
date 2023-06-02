import path from 'path'
import glob from 'fast-glob'
import { findGhost, readTsconfigAlias } from '../util'
import { EXCLUDE_PATTERN } from '../constants'

interface Options {
  pkg?: string[]
  tsconfig?: string[]
  node?: boolean
  exclude?: string[]
  excludePkg?: string[]
}
export default function scanCommand(paths: string[], options: Options) {
  if (!paths.length) {
    paths.push('src')
  }

  // 多package.json 支持
  const packageJSONPath = [
    options.pkg ?? path.resolve(process.cwd(), 'package.json')
  ]
    .flat()
    .map((pattern) => {
      return glob
        .sync(pattern, {
          absolute: true,
          ignore: EXCLUDE_PATTERN.concat(options.exclude || [])
        })
        .filter((v) => v.endsWith('package.json'))
    })
    .flat()

  const tsconfigPath = [
    options.tsconfig ?? path.resolve(process.cwd(), 'tsconfig*.json')
  ]
    .flat()
    .map((pattern) => {
      return glob.sync(pattern, {
        absolute: true,
        ignore: EXCLUDE_PATTERN.concat(options.exclude || [])
      })
    })
    .flat()

  const alias = tsconfigPath.reduce<Record<string, string>>((pre, cur) => {
    // 排除一些常规约定的alias和异常的alisa
    delete pre['']
    delete pre['@']
    delete pre['@/']
    try {
      const tsconfigAlias = readTsconfigAlias(cur)
      return {
        ...pre,
        ...tsconfigAlias
      }
    } catch (error) {
      console.log('tsconfig.json parse error', error)
    }
    return pre
  }, {})

  const ghostDeps = findGhost(paths, packageJSONPath, {
    includeNodeLib: options.node,
    exclude: options.excludePkg || [],
    excludeFilePattern: options.exclude || [],
    alias: alias || {}
  })
  console.log(ghostDeps.length, '👻')
  console.log(ghostDeps)
}
