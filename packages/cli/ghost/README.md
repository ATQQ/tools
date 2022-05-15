# @sugarat/ghost

phantom dependency scanning tool - 幽灵依赖扫描工具

## Usage
### Global CLI
```sh
npm i -g @sugarat/ghost
```

```sh
# default scan src 
ghost scan
```

set scan `dir` or `file`
```sh
ghost scan packages/pkg1/src
```

set `package.json` path

```sh
ghost scan src -p otherDir/package.json
```


### Local
```sh
npm i @sugarat/ghost
# or
yarn add @sugarat/ghost
# or
pnpm add @sugarat/ghost
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
const ghost = findGhost(
  path.join(__dirname, 'src'),
  path.join(process.cwd(), 'package.json')
)
```

## More Info
```sh
ghost --help

ghost scan --help
```