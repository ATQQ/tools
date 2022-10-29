import { sayHello } from '../util'

interface Options {
  target: string
  minify: boolean
}
export default function startCommand(paths: string[], options: Options) {
  console.log('paths', paths)
  console.log('options', options)

  sayHello()
}
