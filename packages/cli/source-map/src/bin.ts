#!/usr/bin/env node

import { Command } from 'commander'
import pkg from '../package.json'
import { parseCommand } from './command'

const program = new Command()
program.version(pkg.version)

program
  .command('parse <sourceUrl>')
  .description('parse error form url source')
  .alias('p')
  .option('-s, --source-map', 'set url source as sourceMap type')
  .option('-l, --line <number>', 'set line number')
  .option('-c, --column <number>', 'set column number')
  .option('-o, --output [string]', 'set log output dir')
  .option('-n, --show-num <number>', 'set show error source lines', '5')
  .action(parseCommand)

program.parse(process.argv)
