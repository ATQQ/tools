import fs from 'fs'
import type { JscTarget } from '@swc/core'
import posthtml from 'posthtml'
import { posthtmlSWCTransform } from '../index'

interface Options {
  ecmaVersion?: JscTarget
  minify?: boolean
}
export default function transformCommand(filesArg: string[], options: Options) {
  for (const filepath of filesArg) {
    const content = fs.readFileSync(filepath, 'utf-8')
    const result = posthtml()
      .use(posthtmlSWCTransform(options.ecmaVersion || 'es5', !!options.minify))
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .process(content, { sync: true }).html
    fs.writeFileSync(filepath, result, 'utf-8')
  }
}
