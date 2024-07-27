#!/usr/bin/env node
const { spawn } = require('child_process')
const { promisify } = require('util')
const process = require('process')
const validatePkgName = require('validate-npm-package-name')
const fg = require('fast-glob')
const { multiselect } = require('@clack/prompts')
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
      '**/public',
    ],
    absolute: true,
  }).forEach((file) => {
    const { name, private: _private } = require(file)
    if (!_private && validatePkgName(name)) {
      pkgNames.push(name)
    }
  })
  // 开始同步
  // 信息打印
  console.log(`共扫描到（${pkgNames.length}个）`, pkgNames.join(', '))
  console.log()
  ; (async () => {
    const selected = await multiselect({
      message: '请选择需要同步的包',
      options: pkgNames.map(name => ({ label: name, value: name })),
    })
    CnpmSync(...selected)
  })()
}
else {
  CnpmSync(...pkgNames)
}

function CnpmSync(...names) {
  // 使用child_process执行cnpm sync
  return promisify(spawn)('npx', ['cnpm', 'sync', ...names], {
    cwd: __dirname,
    stdio: 'inherit',
  })
}
