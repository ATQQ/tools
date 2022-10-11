import path from 'path'
// eslint-disable-next-line import/no-extraneous-dependencies
import { test, expect } from 'vitest'
import {
  checkCode,
  checkFile,
  checkHtmlCode,
  ParserOptions
} from '../src/index'

const defaultOptions: ParserOptions = {
  ecmaVersion: '5',
  sourceType: 'script',
  allowHashBang: false
}
const jsCode = `var str = 'hello'
var str2 = 'world'

const varConst = 'const'
let varLet = 'let'
const arrFun = () => {
    console.log('hello world');
}`

const htmlCode = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>

<body>
    <script src="https://cdn.staticfile.org/jquery/3.6.1/jquery.min.js"></script>
    <script>
        var str = 'hello'
        var str2 = 'world'

        const varConst = 'const'
        let varLet = 'let'
        const arrFun = () => {
            console.log('hello world');
        }
        console.log(str, str2, varConst, varLet, arrFun)
    </script>
</body>

</html>`

console.log(checkCode(jsCode, defaultOptions))
console.log(checkHtmlCode(htmlCode, defaultOptions))
console.log(
  checkFile(path.resolve(__dirname, 'testProject/js/index.js'), defaultOptions)
)

console.log(
  checkFile(path.resolve(__dirname, 'testProject/index.html'), defaultOptions)
)

test('test Files', () => {
  expect(true).toBe(true)
})
