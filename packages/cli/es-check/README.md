# @sugarat/es-check

Check JavaScript&HTML files ES version against a specified ES version 🏆

reference [es-check](https://github.com/yowainwright/es-check),but this is strong and friendly
## Get Started
### By CLI
```sh
npm i @sugarat/es-check --save-dev   # locally
npm i @sugarat/es-check -g           # or globally
```
Check if an array or glob of files matches a specified ES version.

* **Note:** adds quotation around globs. Globs are patterns like so, `<something>/*.js` `<something>/*.html`.
```sh
escheck es5 testProject/**/*.js testProject/**/*.html
```
The ES Check script (above) checks `testProject/**/*.js testProject/**/*.html` files to see if they're ES5. It throws an error and logs files are that do not pass the check.

output terminal

![图片](https://img.cdn.sugarat.top/mdImg/MTY2NDM3ODMyNjc0OQ==664378326749)

output log file

```sh
escheck es5 testProject/**/*.js testProject/**/*.html --out
```

![图片](https://img.cdn.sugarat.top/mdImg/MTY2NDM3ODU2NzI1OA==664378567258)

## More API
```sh
escheck --help
```
```sh
Usage: bin [options] [ecmaVersion] [files...]

Arguments:
  ecmaVersion            ecmaVersion to check files against. Can be: es3, es4, es5, es6/es2015, es7/es2016, es8/es2017, es9/es2018, es10/es2019 .etc
  files                  a glob of files to to test the EcmaScript version against(dist/**/*.js dist/**/*.html)

Options:
  -V, --version          output the version number
  -M,--module            use ES modules
  --allow-hash-bang      if the code starts with #! treat it as a comment
  -E,--exit-code <code>  with Error set process.exit(code)
  -O,--out [filename]    output error message to [filename] file
  -h, --help             display help for command
```
## Usage Example

## Local Lib
<!-- TODO：待完善 -->
```sh
npm i @sugarat/es-check
# or
yarn add @sugarat/es-check
# or
pnpm add @sugarat/es-check
```

#### Option

#### ESM

#### CJS

#### Usage