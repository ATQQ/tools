#!/usr/bin/env node

import { Command } from 'commander'
import pkg from '../package.json'
import { parseCommand, sourcesCommand } from './command'

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

program
  .command('sources <sourceUrl>')
  .description('generating source files by source-map')
  .alias('s')
  .option('-s, --source-map', 'set url source as sourceMap type')
  .option('-o, --output [string]', 'set files output dir')
  .action(sourcesCommand)

program.parse(process.argv)
