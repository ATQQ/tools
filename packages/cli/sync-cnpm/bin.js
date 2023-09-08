#!/usr/bin/env node
const validatePkgName = require('validate-npm-package-name')
const fg = require('fast-glob')
const { spawn } = require('child_process')
const { promisify } = require('util')

// 对输入的进行校验
const pkgNames = process.argv.slice(2).filter(validatePkgName)

// 如果没有内容输入，则直接扫描当前目录下所有的package.json文件
if (pkgNames.length === 0) {
  // 通过glob 取所有package.json
  fg.sync('./**/package.json', {
    ignore: [
      '**/node_modules',
      '**/dist',
      '**/build',
      '**/test',
      '**/tests',
      '**/__tests__',
      '**/__test__',
      '**/demos',
      '**/example',
      '**/examples',
      '**/public'
    ],
    absolute: true
  }).forEach((file) => {
    const { name, private } = require(file)
    if (!private && validatePkgName(name)) {
      pkgNames.push(name)
    }
  })
}

// 开始同步
// 信息打印
console.log(`共扫描到（${pkgNames.length}个）`, pkgNames.join(', '))
console.log()
CnpmSync(...pkgNames)

function CnpmSync(...names) {
  // 使用child_process执行cnpm sync
  return promisify(spawn)('npx', ['cnpm', 'sync', ...names], {
    cwd: __dirname,
    stdio: 'inherit'
  })
}
