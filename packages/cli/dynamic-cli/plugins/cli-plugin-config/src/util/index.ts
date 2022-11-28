import fs from 'fs'

export function getCRUDfn(configName: string) {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const path = require('path')

  const configPath = path.join(
    process.env.HOME || process.env.USERPROFILE || process.cwd(),
    configName
  )

  function getCLIConfig(key = '') {
    try {
      const value = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      return !key
        ? value
        : key.split('.').reduce((pre, k) => {
            return pre?.[k]
          }, value)
    } catch {
      return !key ? {} : ''
    }
  }

  function setCLIConfig(key: string, value: any) {
    if (!key || !value) {
      return
    }
    const nowCfg = getCLIConfig()
    const keys = key.split('.')
    keys.reduce((pre, k, i) => {
      // 赋值
      if (i === keys.length - 1) {
        pre[k] = value
      } else if (!(pre[k] instanceof Object)) {
        pre[k] = {}
      }
      return pre[k]
    }, nowCfg)
    fs.writeFileSync(configPath, JSON.stringify(nowCfg, null, 2))
  }

  function delCLIConfig(key: string) {
    if (!key) {
      return
    }
    const nowCfg = getCLIConfig()
    const keys = key.split('.')
    keys.reduce((pre, k, i) => {
      // 移除
      if (i === keys.length - 1) {
        delete pre[k]
      }
      return pre[k] instanceof Object ? pre[k] : {}
    }, nowCfg)
    fs.writeFileSync(configPath, JSON.stringify(nowCfg, null, 2))
  }

  return {
    getCLIConfig,
    setCLIConfig,
    delCLIConfig,
    configPath
  }
}
