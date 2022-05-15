import { existsSync, readdirSync, readFileSync, statSync } from 'fs'
import path, { join, parse } from 'path'
import AST, { GoGoAST } from 'gogocode'
import { cssExt, jsExt, vueExt } from '../constants'

/**
 * 查找幽灵依赖
 * @param paths 目标文件夹或目录
 * @param pkgJsonPath package.json文件路径
 */
export function findGhost(paths: string | string[], pkgJsonPath: string) {
  const targetPaths = [paths].flat()
  const pkgJson =
    pkgJsonPath && existsSync(pkgJsonPath)
      ? JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
      : {}
  // 已安装依赖
  const deps = {
    ...pkgJson.dependencies,
    ...pkgJson.devDependencies
  }

  // 获取检查的目标文件
  let files: string[] = []
  const supportExt = [...cssExt, ...jsExt, ...vueExt]
  for (const p of targetPaths) {
    if (!existsSync(p)) {
      continue
    }
    if (statSync(p).isDirectory()) {
      files.push(...scanDirFiles(p, supportExt))
    } else {
      files.push(p)
    }
  }
  // 去重
  files = [...new Set(files)]

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
  return [...ghostPkgList]
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
  exclude: Exclude | Exclude[] = ['node_modules', '.git', '.vscode']
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

type Exclude = string | RegExp
export function isExclude(value: string, exclude: Exclude | Exclude[]) {
  const patterns = [exclude].flat()
  return patterns.find((v) =>
    typeof v === 'string' ? value.includes(v) : v.test(value)
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
    .split(path.sep)
  return paths[0].startsWith('@') ? paths.slice(0, 2).join(path.sep) : paths[0]
}
