#!/usr/bin/env node

import { Command } from 'commander'
import pkg from '../package.json'
import { startCommand } from './command'

const program = new Command()
program.version(pkg.version)

program
  .command('test [paths...]')
  .description('command description')
  .alias('t')
  .option('-t, --target [version]', 'set target version', 'es5')
  .option('-m, --minify', 'minify result')
  .action(startCommand)

program.parse(process.argv)
