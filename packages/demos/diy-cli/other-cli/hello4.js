#!/usr/bin/env node

const { Command } = require('commander')
const pkg = require('./package.json')

const program = new Command()
program.version(pkg.version)

program
  .command('hello [paths...]')
  .description('hello world demo')
  .alias('h')
  .option('-p, --pkg <path>', 'set package.json path')
  .action((paths, options) => {
    console.log('😄😄😄')
    console.log(paths)
    console.log(options)
  })

program.parse(process.argv)
