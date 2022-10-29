# @sugarat/inlinejs-transform

HTML InlineJS Transform By SWC - 通过SWC直接处理HTML里的内联脚本

simple minify and ES Compile
## Usage
```sh
npm i -g @sugarat/inlinejs-transform
```
or
```sh
# first
npm i @sugarat/inlinejs-transform
# second
# add ijs command into scripts
```
### Transform
compile advanced ES syntax to specified version by SWC
```sh
ijs transform __test__/test.html
```
![图片](https://img.cdn.sugarat.top/mdImg/MTY2NjU0MTE5Mjk3NQ==666541192975)

```sh
ijs transform -e es5 --minify
```
*  `-e, --ecmaVersion [ecmaVersion]`: set transform jsc target version：ES5、ES5、ES2015...ES2022
*  `-m, --minify`: minify transform result
### Minify
```sh
ijs minify __test__/test.html
```
![图片](https://img.cdn.sugarat.top/mdImg/MTY2NjU0MTExNzIyMw==666541117223)

## In PostHTML
```ts
import posthtml from 'posthtml'

import { posthtmlSWCMinify, posthtmlSWCTransform } from '@sugarat/inlinejs-transform'

const htmlCode = `<body>
  <div id="app"></div>
  <script>
    const hello = 'hello'
  </script>
  <script src="hello.js"></script>
  <script>
    const world = 'hello'
  </script>
  <script>
    console.log(hello,world);
  </script>
</body>`

// minify
const minifyResult = posthtml()
    .use(posthtmlSWCMinify())
    .process(htmlCode, { sync: true }).html

// transform
const transformResult = posthtml()
    .use(posthtmlSWCTransform('es5', true))
    .process(htmlCode, { sync: true }).html
```
options detail see [SWC Declaration](https://swc.rs/docs/usage/core#transformfilesync)


## More Info
```sh
ijs --help
ijs transform --help
ijs minify --help
```