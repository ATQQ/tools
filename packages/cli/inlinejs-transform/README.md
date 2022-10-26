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

## More Info
```sh
ijs --help
ijs transform --help
ijs minify --help
```