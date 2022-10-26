#!/usr/bin/env node

import { Command } from 'commander'
import pkg from '../package.json'
import { minifyCommand, transformCommand } from './command'

const program = new Command()
program.version(pkg.version)

program
  .command('transform [paths...]')
  .description('transform inlineJS code ESVersion by SWC')
  .alias('t')
  .option(
    '-e, --ecmaVersion [ecmaVersion]',
    'set transform jsc target version',
    'es5'
  )
  .option('-m, --minify', 'minify transform result')
  .action(transformCommand)

program
  .command('minify [paths...]')
  .description('minify inlineJS code by SWC')
  .alias('m')
  .action(minifyCommand)

program.parse(process.argv)
