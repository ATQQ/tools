import fs from 'fs'
import posthtml from 'posthtml'
import { posthtmlSWCMinify } from '../index'

export default function minifyCommand(filesArg: string[]) {
  for (const filepath of filesArg) {
    const content = fs.readFileSync(filepath, 'utf-8')
    const result = posthtml()
      .use(posthtmlSWCMinify())
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .process(content, { sync: true }).html
    fs.writeFileSync(filepath, result, 'utf-8')
  }
}
