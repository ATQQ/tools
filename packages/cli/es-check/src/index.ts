import fg from 'fast-glob'
import path from 'path'
import { checkFile } from './util'

const testPattern = path.join(__dirname, '../__test__/testProject/**/*.js')
const files = fg.sync(testPattern)

console.log(files.length)

files.forEach((file) => {
  console.log(file)
  console.log(checkFile(file, { ecmaVersion: '5' }).length)
})
