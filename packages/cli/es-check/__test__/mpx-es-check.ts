// npx esno mpx-es-check.ts
import fg from 'fast-glob'
import path from 'path'
// eslint-disable-next-line import/no-extraneous-dependencies
import * as babelParser from '@babel/parser'
// eslint-disable-next-line import/no-extraneous-dependencies
import babelTraverse from '@babel/traverse'
import fs from 'fs'

const testPattern = path.join(__dirname, 'testProject/**/*.js')
// 要检查的文件
const files = fg.sync(testPattern)

// 解析配置
const acornOpts = {
  ecmaVersion: 2050,
  silent: true,
  locations: true,
  sourceType: 'script'
}

// 错误信息
const problems = []
let errArr: any[] = []

// 部分节点规则
const partRule = {
  VariableDeclaration(node) {
    if (node.kind === 'let' || node.kind === 'const') {
      errArr.push({
        node,
        message: `Using ${node.kind} is not allowed`
      })
    }
  },
  // 箭头函数
  ArrowFunctionExpression(node) {
    errArr.push({
      node,
      message: 'Using ArrowFunction(箭头函数) is not allowed'
    })
  }
}

// 遍历文件
files.forEach((file) => {
  errArr = []
  const nodeQueue = []
  const code = fs.readFileSync(file, 'utf8')
  const ast = babelParser.parse(code, acornOpts as any)
  // 遍历获取所有节点
  babelTraverse(ast, {
    enter(path) {
      const { node } = path
      nodeQueue.push({ isEntering: true, node, path })
    }
  })

  // 遍历每个节点，执行对应的规则
  nodeQueue.forEach(({ node, path }) => {
    partRule[node.type]?.(node)
  })

  // 解析格式化错误
  errArr.forEach((err) => {
    // 省略 sourcemap 解析步骤
    problems.push({
      file,
      message: err.message,
      startLine: err.node.loc.start.line,
      startColumn: err.node.loc.start.column
    })
  })
})

console.log(problems)
