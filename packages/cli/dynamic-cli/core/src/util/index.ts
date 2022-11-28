import fs from 'fs'
import { ICommandDescription } from '../types'

export function defineCommand<T>(options: ICommandDescription & T) {
  return options
}

export function readJSONFIle(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}
