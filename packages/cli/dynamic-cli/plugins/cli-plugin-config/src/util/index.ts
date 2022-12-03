export function getCRUDfn(configName: string, defaultConfig = {}) {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const path = require('path')
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const fs = require('fs')

  const configPath = path.join(
    process.env.HOME || process.env.USERPROFILE || process.cwd(),
    configName
  )

  // 不存在配置文件，则默认生成
  if (!fs.existsSync(path.dirname(configPath))) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true })
  }
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))
  }

  function getCLIConfig(key = '') {
    try {
      const value = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      return !key
        ? value
        : key.split('.').reduce((pre, k) => {
            return pre?.[k]
          }, value)
    } catch {
      return !key ? defaultConfig : ''
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
        // 数租的话移除那一项直接
        if (Array.isArray(pre)) {
          pre.splice(+k, 1)
        } else {
          delete pre[k]
        }
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
