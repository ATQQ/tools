import { existsSync, statSync } from 'fs'
import path from 'path'
import { findGhost } from '../util'

interface Options {
  pkg?: string
  node?: boolean
}
export default function scanCommand(paths: string[], options: Options) {
  if (!paths.length) {
    paths.push('src')
  }
  const targetPaths = paths
    .map((v) => path.resolve(process.cwd(), v))
    .filter((v) => existsSync(v))

  let packageJSONPath = path.resolve(
    process.cwd(),
    options.pkg || 'package.json'
  )

  if (existsSync(packageJSONPath) && statSync(packageJSONPath).isDirectory()) {
    packageJSONPath = path.resolve(packageJSONPath, 'package.json')
  }

  const ghostDeps = findGhost(targetPaths, packageJSONPath, {
    includeNodeLib: options.node
  })
  console.log(ghostDeps.length, '👻')
  console.log(ghostDeps)
}
