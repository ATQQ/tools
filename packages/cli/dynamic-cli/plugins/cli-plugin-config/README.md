# @sugarat/cli-plugin-config

Expand the config command for commander

## Quick Started
install
```sh
npm install @sugarat/cli-plugin-config
```

register
```ts
import definePlugin from '@sugarat/cli-plugin-config'
import { Command } from 'commander'

const programInstance = new Command()

const defaultConfig = {}
const configPlugin = definePlugin('.sugarat/.clirc', defaultConfig)

configPlugin.command(programInstance)

programInstance.parse(process.argv)
```

then you cli will have config command

![图片](https://img.cdn.sugarat.top/mdImg/MTY3MDA3ODI0NzQyNw==670078247427)

## CRUD
```sh
command get <key>
command set <key> <value>
command del <key>
command ls
```

![图片](https://img.cdn.sugarat.top/mdImg/MTY3MDA3ODY3MDQ5Ng==670078670496)