#!/usr/bin/env node

import { Command } from 'commander'
import pkg from '../package.json'
import { defaultCommand, configCommand } from './command'

const program = new Command()
program.version(pkg.version)

program
  .argument('<url>', 'set download source url')
  .option('-f,--filename <filename>', 'set download filename')
  .option('-L,--location <times>', 'set location times', '10')
  .option('-t,--timeout <timeout>', 'set the request timeout(ms)', '3000')
  .option('-p,--proxy <proxy server>', 'set proxy server')
  .option('-o,--override', 'override duplicate file', false)
  .action(defaultCommand)

program
  .command('config <type> <key> [value]')
  .alias('c')
  .description('crud cli config( ~/.efstrc ) <type> in [get,set,del]')
  .action(configCommand)

program.parse(process.argv)
