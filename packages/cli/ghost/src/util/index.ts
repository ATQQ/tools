import { existsSync, readdirSync, readFileSync, statSync } from 'fs'
import path, { join, parse } from 'path'
import AST, { GoGoAST } from 'gogocode'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import validPkgName from 'validate-npm-package-name'
import glob from 'fast-glob'
import { cssExt, EXCLUDE_PATTERN, jsExt, vueExt } from '../constants'
import type { GhostOptions, ExcludePattern } from '../types'

/**
 * 查找幽灵依赖
 * @param paths 目标文件夹或目录（support glob pattern）
 * @param pkgJsonPath package.json文件路径
 */
export function findGhost(
  paths: string | string[],
  pkgJsonPath: string | string[],
  options: GhostOptions = {}
): string[] {
  // 做一层兼容适配输入相对目录，兼容之前的逻辑
  const targetPatterns = [paths].flat().map((p) => {
    if (!p.includes('*')) {
      const absoluteP = path.resolve(process.cwd(), p)
      if (existsSync(absoluteP) && statSync(absoluteP).isDirectory()) {
        return path.join(p, '/**/**')
      }
    }
    return p
  })
  const excludeFilePattern = [options.excludeFilePattern || []]
    .concat(EXCLUDE_PATTERN)
    .flat()

  // 已安装依赖
  const deps = [pkgJsonPath]
    .flat()
    .filter((p) => existsSync(p))
    .reduce((pre, cur) => {
      const pkgJson = JSON.parse(readFileSync(cur, 'utf-8'))
      return {
        ...pre,
        ...pkgJson.dependencies,
        ...pkgJson.devDependencies
      }
    }, {})

  // 获取检查的目标文件
  let files: string[] = []
  const supportExt = [...cssExt, ...jsExt, ...vueExt]

  files.push(
    ...glob.sync(targetPatterns, { absolute: true, ignore: excludeFilePattern })
  )

  // 过滤出需要的文件
  files = [...new Set(files)].filter((f) => supportExt.includes(parse(f).ext))

  // 获取文件里引入的第三方包
  const pkgList: string[] = []
  for (const file of files) {
    const importSources = getFileImportSource(
      readFileSync(file, 'utf-8'),
      parse(file).ext
    )
    const validSource = importSources.filter((v) =>
      isValidNodeModulesSource(file, v)
    )
    const pkgNames = validSource.map((v) => getPkgNameBySourcePath(v))
    pkgList.push(...pkgNames)
  }

  // 从找到的第三方包里剔除已安装的，剩下的就是幽灵依赖
  const ghostPkgList = new Set(pkgList)
  for (const dep of Object.keys(deps)) {
    if (ghostPkgList.has(dep)) {
      ghostPkgList.delete(dep)
    }
  }

  const excludePkg = options.exclude ?? []
  const excludeNodeLib = !(options.includeNodeLib ?? false)
  return (
    [...ghostPkgList]
      .filter((v) => !isExclude(v, excludePkg))
      // 控制是否排除node包
      .filter((v) => !excludeNodeLib || !isNodeLib(v))
      // 只保留合法包名(与上面的不能冲突)
      .filter((v) =>
        excludeNodeLib || !isNodeLib(v) ? isValidPkgName(v) : true
      )
      // 过滤掉alias的路径
      .filter((v) => !isAliasPath(options.alias ?? {}, v))
  )
}

export function getFileImportSource(fileText: string, ext: string) {
  const sources: string[] = []

  if (jsExt.includes(ext)) {
    sources.push(...getJsFileImportSource(fileText))
  }
  if (cssExt.includes(ext)) {
    sources.push(...getCssFileImportSource(fileText))
  }
  if (vueExt.includes(ext)) {
    sources.push(...getVueFileImportSource(fileText))
  }
  return sources
}

export function getVueFileImportSource(fileText: string) {
  const sources: string[] = []
  // 目前发现Vue3 <script lang="ts" setup> 的无法正常解析，所以在解析前先处理一下setup关键字
  const ast = AST(fileText.replace(/<script(.*)setup(.*)>/, '<script$1$2>'), {
    parseOptions: { language: 'vue' }
  })
  const script = ast.find('<script></script>').generate().trim()
  sources.push(...getJsFileImportSource(script))
  sources.push(...getCssFileImportSource(fileText))
  return sources
}

export function getCssFileImportSource(fileText: string) {
  const sources: string[] = []
  const importRegexp = /^@import\s+['"](.*)?['"]/
  const lines = fileText.split('\n')
  for (const line of lines) {
    const match = line.trim().match(importRegexp)?.[1]
    if (match) {
      sources.push(match)
    }
  }
  return sources
}

export function getJsFileImportSource(fileText: string) {
  const sources: string[] = []
  // fix import.meta. gogoCode无法解析
  fileText = fileText.replace(/import\.meta\.?/g, 'import_meta')
  const ast = AST(fileText)
  if (!ast.find) {
    return sources
  }
  // 处理import from/export from
  const fromCallback = (node: GoGoAST) => {
    const importPath = node.attr('source.value') as string
    sources.push(importPath)
  }
  ast.find({ type: 'ImportDeclaration' }).each(fromCallback)
  ast.find({ type: 'ExportNamedDeclaration' }).each(fromCallback)

  // 处理import('')
  ast.find('import($_$)').each((node) => {
    const importPath = node.match[0][0]?.value
    sources.push(importPath)
  })
  // 处理require('')
  ast.find('require($_$)').each((node) => {
    const importPath = node.match[0][0]?.value
    sources.push(importPath)
  })
  return sources
}

export function scanDirFiles(
  dir: string,
  extList: string[] = [],
  exclude: ExcludePattern | ExcludePattern[] = [
    'node_modules',
    '.git',
    '.vscode'
  ]
) {
  const files = readdirSync(dir, { withFileTypes: true })
  const res: string[] = []
  for (const file of files) {
    const filename = join(dir, file.name)
    if (isExclude(filename, exclude)) {
      continue
    }

    if (
      file.isFile() &&
      (extList.length === 0 || extList.includes(parse(filename).ext))
    ) {
      res.push(filename)
    }

    if (file.isDirectory()) {
      res.push(...scanDirFiles(filename, extList, exclude))
    }
  }
  return res
}

export function isExclude(
  value: string,
  exclude: ExcludePattern | ExcludePattern[]
) {
  const patterns = [exclude].flat().filter((v) => v)
  return (
    patterns.findIndex((pattern) =>
      typeof pattern === 'string'
        ? value.includes(pattern)
        : pattern.test(value)
    ) !== -1
  )
}

export function isValidNodeModulesSource(
  filePath: string,
  importSourcePath: string
) {
  const { dir } = parse(filePath)
  if (!importSourcePath) {
    return false
  }
  if (importSourcePath.includes('node_modules')) {
    return true
  }
  if (
    ['./', '../', '@/', '~@/', '`'].some((prefix) =>
      importSourcePath.startsWith(prefix)
    )
  ) {
    return false
  }
  if (
    ['', ...cssExt, ...jsExt].some((ext) =>
      existsSync(join(dir, `${importSourcePath}${ext}`))
    )
  ) {
    return false
  }
  return true
}

export function getPkgNameBySourcePath(pkgPath: string) {
  const paths = pkgPath
    .replace(/~/g, '')
    .replace(/.*node_modules\//, '')
    .split('/')
  return paths[0].startsWith('@') ? paths.slice(0, 2).join('/') : paths[0]
}

export function isNodeLib(v: string) {
  return /^(?:assert|buffer|child_process|cluster|console|constants|crypto|dgram|dns|domain|events|fs|http|https|module|net|os|path|punycode|querystring|readline|repl|stream|string_decoder|sys|timers|tls|tty|url|util|vm|zlib)$/.test(
    v
  )
}

export function isValidPkgName(pkgName: string): boolean {
  const result = validPkgName(pkgName)
  return result.validForNewPackages
}

export function readTsconfigAlias(tsconfigPath: string) {
  const tsconfig = readFileSync(tsconfigPath, 'utf-8')
  const { compilerOptions } = JSON.parse(tsconfig)
  const alias = compilerOptions?.paths ?? {}
  const res: Record<string, string> = {}
  for (const [key, value] of Object.entries(alias)) {
    // @ts-ignore
    res[key.replace(/\/\*$/, '')] = value[0].replace(/\/\*$/, '')
  }
  return res
}

export function isAliasPath(alias: Record<string, string>, path: string) {
  return Object.keys(alias).some((key) => path.startsWith(key))
}
