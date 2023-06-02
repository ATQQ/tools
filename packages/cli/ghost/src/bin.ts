#!/usr/bin/env node

import { Command } from 'commander'
import pkg from '../package.json'
import { scanCommand } from './command'

const program = new Command()
program.version(pkg.version)

program
  .command('scan [files...]')
  .description(
    'scan a glob of files for phantom dependency (default src/**/**)'
  )
  .alias('s')
  .option('-e, --exclude <globPatterns...>', 'exclude scan some files')
  .option(
    '-p, --pkg <paths...>',
    'set package.json file or directory (support glob pattern)'
  )
  .option('-t, --tsconfig <paths...>','set tsconfig.json file')
  .option('-n, --node', 'include node lib {fs, path, etc}')
  .option(
    '--allow-dirty',
    'these directories are masked by default (node_modules, .git etc)，you can set allow'
  )
  .option(
    '--exclude-pkg <pkgNamePattern...>',
    'set forcibly excluded phantom dependence pattern (exclude include string)'
  )
  .action(scanCommand)

program.parse(process.argv)
