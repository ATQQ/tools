# 一些测试脚本

安装依赖
```sh
pnpm install
```
## 运行demo
### es-check
```sh
npx esno es-check.ts
```
![图片](https://img.cdn.sugarat.top/mdImg/MTY2NDEwNzY1NjA0Nw==664107656047)

### sourcemap
```sh
npx esno source-map.ts
```
![图片](https://img.cdn.sugarat.top/mdImg/MTY2NDAzMjI5MTA1Mw==664032291053)

### mpx-es-check
```sh
npx esno mpx-es-check.ts
```
![图片](https://img.cdn.sugarat.top/mdImg/MTY2NDA5MjM0NDgyNQ==664092344825)

## 参考
### es-check
```sh
# 1
npm i -g es-check
# 2
es-check es5 testProject/**/*.js
```
![图片](https://img.cdn.sugarat.top/mdImg/MTY2NDAyODU1NTI3OA==664028555278)

### mpx-es-check
```sh
# 1
npm i @mpxjs/es-check -g
# 2
mpx-es-check --ecma=6 testProject/**/*.js
```
![图片](https://img.cdn.sugarat.top/mdImg/MTY2NDA3Mzg0NTcxNw==664073845717)
