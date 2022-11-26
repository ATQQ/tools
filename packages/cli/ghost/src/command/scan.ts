import { existsSync, statSync } from 'fs'
import path from 'path'
import { findGhost } from '../util'

interface Options {
  pkg?: string
  node?: boolean
  exclude?: string[]
  allowDirty?: boolean
  excludePkg?: string[]
}
export default function scanCommand(paths: string[], options: Options) {
  if (!paths.length) {
    paths.push('src')
  }

  let packageJSONPath = path.resolve(
    process.cwd(),
    options.pkg || 'package.json'
  )

  // TODO：多package.json 支持
  if (existsSync(packageJSONPath) && statSync(packageJSONPath).isDirectory()) {
    packageJSONPath = path.resolve(packageJSONPath, 'package.json')
  }

  const ghostDeps = findGhost(paths, packageJSONPath, {
    includeNodeLib: options.node,
    exclude: options.excludePkg || [],
    excludeFilePattern: (options.exclude || []).concat(
      options.allowDirty ? [] : ['node_modules/**', '.git/**']
    )
  })
  console.log(ghostDeps.length, '👻')
  console.log(ghostDeps)
}
