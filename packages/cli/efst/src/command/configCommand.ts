import { ConfigType } from '../types'
import { setCLIConfig, delCLIConfig, getCLIConfig } from '../util'

export default function defaultCommand(
  type: ConfigType,
  key: string,
  value: string
) {
  if (type === 'set') {
    setCLIConfig(key, value)
  }
  if (type === 'del') {
    delCLIConfig(key)
  }
  if (type === 'get') {
    console.log(getCLIConfig(key) || '')
  }
}
