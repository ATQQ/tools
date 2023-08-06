const { execSync } = require('child_process')

const branch = execSync('git branch --show-current')
  .toString()
  .trim()
  .replace(/\n/g, '')
console.log(branch)
