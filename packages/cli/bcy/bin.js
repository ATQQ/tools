#!/usr/bin/env node
const { execSync } = require('child_process')
const ncp = require('copy-paste')

// 获取当前仓库分支
const branch = execSync('git branch --show-current')
  .toString()
  .trim()
  .replace(/\n/g, '')

console.log('当前分支:', branch)

ncp.copy(branch)
