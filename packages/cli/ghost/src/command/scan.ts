import path from 'path'
import glob from 'fast-glob'
import { findGhost } from '../util'
import { EXCLUDE_PATTERN } from '../constants'

interface Options {
  pkg?: string[]
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

  const ghostDeps = findGhost(paths, packageJSONPath, {
    includeNodeLib: options.node,
    exclude: options.excludePkg || [],
    excludeFilePattern: options.exclude || []
  })
  console.log(ghostDeps.length, '👻')
  console.log(ghostDeps)
}
