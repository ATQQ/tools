# @sugarat/source-map-cli

CLI for source-map tool，simple but powerful

## Quick Started
```sh
npm i -g @sugarat/source-map-cli
```

```sh
smt parse https://script.sugarat.top/js/tests/index.9bb0da5c.js:24:17596

smt parse https://script.sugarat.top/js/tests/index.9bb0da5c.js -l 24 -c 17596

smt sources https://script.sugarat.top/js/tests/index.9bb0da5c.js
```

![图片](https://img.cdn.sugarat.top/mdImg/MTY2NzY2MTU3MjI4NQ==667661572285)

### Parse Examples
parse js error file
```sh
Usage: smt parse|p [options] <sourceUrl>

parse error form url source

Options:
  -s, --source-map         set url source as sourceMap type
  -l, --line <number>      set line number
  -c, --column <number>    set column number
  -o, --output [string]    set log output dir
  -n, --show-num <number>  set show error source lines (default: "5")
```

parse http source
```sh
smt parse https://script.sugarat.top/js/tests/index.9bb0da5c.js:24:17596
# or
smt parse https://script.sugarat.top/js/tests/index.9bb0da5c.js -l 24 -c 17596
```

parse local file
```sh
smt parse /Users/sugar/tests/index.9bb0da5c.js -l 24 -c 17596
```
parse source-map file
```sh
smt parse https://script.sugarat.top/js/tests/index.9bb0da5c.js.map:24:17596 -s
```

also can out put file

```sh
smt parse https://script.sugarat.top/js/tests/index.9bb0da5c.js:24:17596 -o ./
```

![图片](https://img.cdn.sugarat.top/mdImg/MTY2NzY1NzIwMDI4OQ==667657200289)

### Sources Examples
generate sources
```sh
Usage: bin sources|s [options] <sourceUrl>

generating source files by source-map

Options:
  -s, --source-map       set url source as sourceMap type
  -o, --output [string]  set files output dir
```

```sh
smt sources https://script.sugarat.top/js/tests/index.9bb0da5c.js
```

![图片](https://img.cdn.sugarat.top/mdImg/MTY2NzY2MDI1Mjg4MA==667660252880)

## AS Lib
```ts
import { getErrorSourceResult } from '@sugarat/source-map-cli'

const result = getErrorSourceResult(url,line,column)
```
more function see [src/util/index.ts](./src/util/index.ts)