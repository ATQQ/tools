# @sugarat/cli

A dynamic CLI tool，Based on [Commander](https://www.npmjs.com/package/commander)

Support Plugin System

## Quick Start

```sh
npm i -g @sugarat/cli
```

then you will get `q` command

install cli plugin

```sh
q install hello [words...]
q install hello
q install hello 真不戳

# equal
q install @sugarat/cli-plugin-hello@latest
```

then you `q` have hello command
```sh
q hello
```

## More Plugins
It will come soon.