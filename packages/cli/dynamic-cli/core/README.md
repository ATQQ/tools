# @sugarat/cli

A dynamic CLI tool，Based on [Commander](https://www.npmjs.com/package/commander)

Support Plugin System

## Quick Start

```sh
npm i -g @sugarat/cli
```

then you will get `q` and `sug` command

install cli plugin

```sh
sug install hello [words...]
sug install hello
sug install hello 真不戳

# equal
sug install @sugarat/cli-plugin-hello@latest
```

then you `sug` have hello command
```sh
sug hello
```

## More Plugins
It will come soon.