# @sugarat/ghost

phantom dependency scanning tool - 幽灵依赖扫描工具

![图片](https://img.cdn.sugarat.top/mdImg/MTY2OTQ1MzI3OTg4Nw==669453279887)

## Quick Started
```sh
npm i -g @sugarat/ghost
```

```sh
# default scan "src/**/**"
ghost scan
```

set scan `dir` or `file`
```sh
ghost scan [target...]

# a directory
ghost scan packages/pkg1/src

# a file
ghost scan src/index.ts

# support glob pattern
ghost scan src/**/** packages/a/**/**
```

![图片](https://img.cdn.sugarat.top/mdImg/MTY2OTQ1NDEyMDUyOA==669454120528)

set `package.json` path

```sh
# default process.cwd()/package.json
ghost scan src -p <paths...>

ghost scan src -p ./package.json otherDir/package.json
```

![图片](https://img.cdn.sugarat.top/mdImg/MTY2OTQ2NjQ2OTk3OA==669466469978)

## Advanced Usage
### CLI
#### Exclude phantom dependency
```sh
ghost scan [pattern...] --exclude-pkg [pkgName...]

ghost scan src/index.tsx --exclude-pkg react react-dom
```

![图片](https://img.cdn.sugarat.top/mdImg/MTY2OTQ1NDc5MjYwNQ==669454792605)
#### Exclude Scan Files
```sh
ghost scan [pattern...] -e [pattern...]
ghost scan [pattern...] --exclude [pattern...]

ghost scan src -e src/index.tsx
```

![图片](https://img.cdn.sugarat.top/mdImg/MTY2OTQ1NTAyNDY0OA==669455024648)

### Local
```sh
npm i @sugarat/ghost
# or
yarn add @sugarat/ghost
# or
pnpm add @sugarat/ghost
```

#### Option
```ts
export interface GhostOptions {
  /**
   * need exclude pkg pattern
   */
  exclude?: ExcludePattern | ExcludePattern[]
  /**
   * include node lib {fs, path, etc}
   * @default false
   */
  includeNodeLib?: boolean
  /**
   * need exclude scan files pattern
   */
  excludeFilePattern?: string | string[]
}
declare type ExcludePattern = string | RegExp;

/**
 * @param paths target file or directory （support glob pattern）
 * @param pkgJsonPath package.json path
 */
declare function findGhost(paths: string | string[], pkgJsonPath: string, options?: GhostOptions): string[];
```

#### ESM
```ts
import { findGhost } from '@sugarat/ghost'
// or
import { findPhantom } from '@sugarat/ghost'
```
#### CJS
```ts
const { findGhost } = require('@sugarat/ghost')
```

#### Usage
```ts
// simple
findGhost('src/**/**','./package.json')

// specific 
const phantomDependency = findGhost(
  path.join(__dirname, 'src'),
  path.join(process.cwd(), 'package.json')
)
```

## More Info
```sh
ghost --help

ghost scan --help
```

More Details See [Source Utils](./src/util/index.ts)