export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function randomString(length: number) {
  return Math.random()
    .toString(36)
    .slice(2, length + 2)
}

export function getDefaultUserConfig() {
  const server = {
    USER: randomString(8),
    PWD: `ep${randomString(6)}`
  }
  const mysql = {
    host: '127.0.0.1',
    port: 3306,
    database: '',
    user: '',
    password: ''
  }
  const mongo = {
    host: '127.0.0.1',
    port: 27017,
    database: 'ep-db',
    user: '',
    password: '',
    auth: false
  }

  const redis = {
    host: '127.0.0.1',
    port: 6379,
    password: '',
    auth: false
  }

  const qiniu = {
    accessKey: '',
    secretKey: '',
    bucketName: '',
    bucketDomain: '',
    imageCoverStyle: '',
    imagePreviewStyle: '',
    bucketZone: 'huanan'
  }

  const tx = {
    secretId: '',
    secretKey: '',
    templateId: '',
    smsSdkAppid: '',
    signName: ''
  }

  const config = {
    server,
    mysql,
    mongo,
    redis,
    qiniu,
    tx
  }
  const userConfig = Object.keys(config).reduce(
    (pre, type) => {
      pre.push(
        ...Object.entries(config[type as keyof typeof config]).map(
          ([key, value]) => ({
            type,
            key,
            value,
            isSecret:
              type === 'server' || ['password', 'secretKey'].includes(key)
          })
        )
      )
      return pre
    },
    [] as {
      type: string
      key: string
      value: any
      isSecret: boolean
    }[]
  )
  return userConfig
}
