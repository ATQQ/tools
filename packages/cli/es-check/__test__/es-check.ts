// npx esno es-check.ts
import fg from 'fast-glob'
import path from 'path'
import * as acorn from 'acorn'
import fs from 'fs'

const testPattern = path.join(__dirname, 'testProject/**/*.js')
// 要检查的文件
const files = fg.sync(testPattern)

// acorn 解析配置
const acornOpts = {
  ecmaVersion: 5,
  silent: true
  //   sourceType: 'module'
  // allowHashBang:true
}

// 错误
const errArr: any[] = []

// 遍历文件
files.forEach((file) => {
  const code = fs.readFileSync(file, 'utf8')
  try {
    acorn.parse(code, acornOpts as any)
  } catch (err: any) {
    const errorObj = {
      err,
      stack: err.stack,
      file
    }
    errArr.push(errorObj)
  }
})

// 打印错误
if (errArr.length > 0) {
  console.error(
    `ES-Check: there were ${errArr.length} ES version matching errors.`
  )
  errArr.forEach((o) => {
    console.info(`
        ES-Check Error:
        ----
        · erroring file: ${o.file}
        · error: ${o.err}
        · see the printed err.stack below for context
        ----\n
        ${o.stack}
      `)
  })
  process.exit(1)
}

console.info(`ES-Check: there were no ES version matching errors!  🎉`)
