import {
  intro,
  outro,
  confirm,
  select,
  spinner,
  isCancel,
  cancel,
  text
} from '@clack/prompts'
import axios from 'axios'
import chalk from 'chalk'
import semver from 'semver'
import path from 'path'
import fs from 'fs'
import { execSync, exec } from 'child_process'
import { getCLIConfig, setCLIConfig } from '@sugarat/cli'
import portfinder from 'portfinder'
import { promisify } from 'util'
import { RegistryInfo, Version } from '../type'

const execAsync = promisify(exec)

async function getNpmVersions(
  type: 'client' | 'server',
  tag: 'latest' | 'beta'
) {
  const registryUrl = `https://registry.npmmirror.com/@sugarat/easypicker2-${type}`
  const { data } = await axios.get<RegistryInfo>(registryUrl)
  const versions = Object.values(data.versions)
    .map((version) => version)
    //
    .filter((versionData) => {
      const { version } = versionData
      // 其它判断方式
      if (tag === 'beta') {
        return version.includes(tag)
      }
      return !version.includes('beta')
    })

  versions.sort((a, b) => {
    return +semver.cmp(a.version, '<', b.version) > 0 ? 1 : -1
  })
  return versions
}

async function setupMySqlDatabase() {
  // 输入数据库名称
  const dbName = await text({
    message: '请输入数据库名称',
    placeholder: '已存在的空数据库名称（如没有，请先创建一个空数据库）',
    validate: (value) => {
      if (value.trim() === '') {
        return '数据库名称不能为空'
      }
    }
  })
  if (isCancel(dbName)) {
    cancel('取消')
    return process.exit(0)
  }

  // 输入数据库用户名
  const dbUser = await text({
    message: '请输入数据库用户名',
    placeholder: '数据库用户名',
    validate: (value) => {
      if (value.trim() === '') {
        return '数据库用户名不能为空'
      }
    }
  })
  if (isCancel(dbUser)) {
    cancel('取消')
    return process.exit(0)
  }

  // 输入数据库密码
  const dbPassword = await text({
    message: '请输入数据库密码',
    placeholder: '数据库密码',
    validate: (value) => {
      if (value.trim() === '') {
        return '数据库密码不能为空'
      }
    }
  })

  if (isCancel(dbPassword)) {
    cancel('取消')
    return process.exit(0)
  }

  // 确认信息
  const confirmInfo = await confirm({
    message: `再次确认上述录入的数据库信息是否正确？`,
    initialValue: true
  })

  if (isCancel(confirmInfo)) {
    cancel('取消')
    return process.exit(0)
  }

  // 初始化数据库
  await initMysql(dbName, dbUser, dbPassword)
  outro(`mysql 数据表初始化完成！🎉`)
}

export async function initMysql(
  dbName: string,
  user: string,
  password: string
) {
  const mysqlSpinner = spinner()
  const sqlFile = path.resolve(__dirname, 'auto_create.sql')
  mysqlSpinner.start('初始化数据库表')
  try {
    const { stdout, stderr } = await execAsync(
      `mysql -u${user} -p${password} -e "use ${dbName};source ${sqlFile};show tables;"`
    )
    mysqlSpinner.stop(`表导入完成 \n${stdout}\n${stderr}`)
  } catch (error: any) {
    mysqlSpinner.stop(error?.message)
    cancel('表导入失败')
    return process.exit(0)
  }
}

export async function deployMenu() {
  // 菜单提示
  console.log()
  intro(chalk.inverse(' 部署 EasyPicker 项目 '))

  const projectType = await select({
    message: '选择部署端',
    options: [
      { value: 'client', label: '客户端 - client' },
      { value: 'database', label: '数据库 - mysql' },
      { value: 'server', label: '服务端 - server' }
    ],
    initialValue: 'latest'
  })

  if (isCancel(projectType)) {
    cancel('取消部署')
    return process.exit(0)
  }

  if (projectType === 'database') {
    await setupMySqlDatabase()
    return
  }

  // 稳定版 latest / 预览版本 beta
  const projectTag = await select({
    message: '选择部署版本',
    options: [
      { value: 'latest', label: '稳定版 - latest' },
      { value: 'beta', label: '预览版 - beta' }
    ],
    initialValue: 'latest'
  })

  if (isCancel(projectTag)) {
    cancel('取消部署')
    return process.exit(0)
  }
  // 拉取所有版本信息

  const versions = await getNpmVersions(
    projectType as 'client' | 'server',
    projectTag as 'latest' | 'beta'
  )

  // 显示对应的版本
  const versionData = await select({
    message: '选择具体版本',
    options: versions.map((v) => {
      return {
        value: v,
        label: v.version
      }
    }),
    initialValue: versions[0]
  })

  if (isCancel(versionData)) {
    cancel('取消部署')
    return process.exit(0)
  }

  // 拉取版本资源
  const pullDist = spinner()
  pullDist.start('资源包拉取中...')

  const pullResult: any = await pullPkg(versionData)
  if (typeof pullResult === 'string') {
    pullDist.stop(`资源包拉取完成 (${pullResult})`)
  } else {
    pullDist.stop(pullResult?.message)
    cancel('资源包拉取失败')
    return process.exit(0)
  }

  // 解压资源包
  const extractDist = spinner()
  extractDist.start('资源包解压中...')
  unPkg(pullResult, projectType)
  if (projectType === 'client') {
    extractDist.stop('资源解压完成（目录：./dist）')
  }
  if (projectType === 'server') {
    extractDist.stop('资源解压完成（目录：./easypicker2-server）')
  }

  if (projectType === 'client') {
    outro(`部署完成！🎉，记得设置 nginx 访问目录为 dist 目录`)
    return
  }
  if (projectType === 'server') {
    // 安装依赖
    await installDeps()
    // 确定服务名和端口号
    const [serverName, serverPort] = await setServerConfig()
    // 启动服务
    await setupServer(serverName, serverPort)
    outro(`部署完成！🎉，记得配置反向代理`)
  }
}

async function pullPkg(version: Version) {
  // 取资源路径
  const sourceUrl = version.dist.tarball
  const sourceName = path.basename(sourceUrl)
  if (fs.existsSync(sourceName)) {
    return sourceName
  }
  try {
    const result = await axios.get(sourceUrl, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      responseType: 'arraybuffer'
    })
    // 保存资源到本地
    await fs.promises.writeFile(sourceName, result.data, 'binary')
  } catch (error) {
    return error
  }
  return sourceName
}

function unPkg(pkgName: string, type: string) {
  const targetDir = path.resolve(
    process.cwd(),
    type === 'client' ? './' : 'easypicker2-server'
  )

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  execSync(`tar -xf ${pkgName} -C ${targetDir}`, {
    stdio: 'ignore',
    cwd: process.cwd()
  })

  if (type === 'client') {
    // 移除原来的 dist 目录
    execSync(`rm -rf dist && mkdir dist`, {
      stdio: 'ignore',
      cwd: process.cwd()
    })
    // 移动解压后的 dist 目录
    execSync(`mv -f package/dist/* dist`, {
      stdio: 'ignore',
      cwd: process.cwd()
    })
    // 删除资源目录
    execSync('rm -rf package', {
      stdio: 'ignore',
      cwd: process.cwd()
    })
  }
  if (type === 'server') {
    // 移除 package.json dist .env LICENSE README.md 等文件
    execSync(`rm -rf package.json dist .env LICENSE README.md`, {
      stdio: 'ignore',
      cwd: `${process.cwd()}/easypicker2-server`
    })
    // 移动解压后的文件到根目录
    execSync(`mv -f package/* . && mv -f package/.env . && rm -rf package`, {
      stdio: 'ignore',
      cwd: `${process.cwd()}/easypicker2-server`
    })
  }
}

async function installDeps() {
  const installDist = spinner()
  installDist.start('pnpm 安装依赖中...')
  await execAsync(
    'npm config set registry https://registry.npmmirror.com/ && pnpm install',
    {
      cwd: `${process.cwd()}/easypicker2-server`
    }
  )
  installDist.stop('依赖安装完成 (use pnpm)')
}

async function setServerConfig(): Promise<[string, number]> {
  const serverDir = `${process.cwd()}/easypicker2-server`
  const serverList = getCLIConfig('server.list')
  const serverInfo = serverList.find((v: any) => v.dir === serverDir) || {}

  const name = await text({
    message: '设置服务名 (如重新部署已存在服务，请不要修改直接确认)',
    placeholder: '设置服务名字',
    initialValue: serverInfo?.name || 'ep-server',
    validate: (value) => {
      if (value.trim() === '') {
        return '服务名不能为空'
      }
    }
  })

  if (isCancel(name)) {
    cancel('取消部署')
    return process.exit(0)
  }

  const stopService = await confirm({
    message: `即将停止旧服务 ${name}，是否继续？(首次部署，直接确认继续即可)`,
    initialValue: true
  })

  if (isCancel(stopService)) {
    cancel('取消部署')
    return process.exit(0)
  }
  if (!stopService) {
    cancel('取消部署')
    return process.exit(0)
  }
  const deleteServiceSpinner = spinner()
  deleteServiceSpinner.start('正在移除旧服务...')
  await deleteService(name)
  deleteServiceSpinner.stop(`旧服务终止完成 (pm2 delete ${name})`)

  await sleep(1500)

  await portfinder.setBasePort(serverInfo?.port || 3000)
  const initPort = await portfinder.getPortPromise()
  const port = await text({
    message: '设置你的服务端口号（推荐使用提供的默认端口号，避免端口冲突）',
    placeholder: '服务端口号（1024 到 65535）',
    initialValue: `${initPort}`
  })

  if (isCancel(port)) {
    cancel('取消部署')
    return process.exit(0)
  }

  const okPort = await portfinder.getPortPromise({
    port: +port
  })
  if (okPort !== +port) {
    cancel(`端口 ${port} 已被占用，请重新设置端口号，推荐使用提供的默认端口号`)
    return process.exit(0)
  }

  if (!serverInfo.name) {
    serverList.push(serverInfo)
  }
  serverInfo.dir = serverDir
  serverInfo.name = name
  serverInfo.port = +port

  setCLIConfig('server.list', serverList)

  return [name, +port]
}

async function setupServer(name: string, port: number) {
  const startSpinner = spinner()

  // 设置 port
  const localEnvFile = `${process.cwd()}/easypicker2-server/.env.local`
  if (!fs.existsSync(localEnvFile)) {
    await fs.promises.writeFile(localEnvFile, `SERVER_PORT=${port}`)
  } else {
    const content = await fs.promises.readFile(localEnvFile, 'utf-8')
    if (!content.includes(`SERVER_PORT=`)) {
      await fs.promises.writeFile(
        localEnvFile,
        `${content}\n\nSERVER_PORT=${port}`
      )
    } else {
      await fs.promises.writeFile(
        localEnvFile,
        content.replace(/SERVER_PORT=.*/, `SERVER_PORT=${port}`)
      )
    }
  }
  const startCmd = `pm2 start npm --name ${name} -- run start`
  startSpinner.start('正在启动服务...')
  await sleep(1000)
  await execSync(startCmd, {
    cwd: `${process.cwd()}/easypicker2-server`
  })
  await sleep(2000)
  startSpinner.stop(`服务启动完成 (pm2 logs ${name} --out 查看启动日志)`)
}

async function deleteService(serverName: string) {
  try {
    await execAsync(`pm2 delete ${serverName}`, {
      cwd: `${process.cwd()}/easypicker2-server`
    })
  } catch {}
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
