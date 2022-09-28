#!/usr/bin/env node

import { Command } from 'commander'
import pkg from '../package.json'
import { startCommand } from './command'

const program = new Command()
program.version(pkg.version)

// reference es-check https://github.com/yowainwright/es-check
/**
 * es-check 🏆
 * ----
 * @description
 * - define the EcmaScript version to check for against a glob of JavaScript&HTML files
 * - match the EcmaScript version option against a glob of files
 *   to to test the EcmaScript version of each file
 * - error failures
 */
program
  .argument(
    '[ecmaVersion]',
    'ecmaVersion to check files against. Can be: es3, es4, es5, es6/es2015, es7/es2016, es8/es2017, es9/es2018, es10/es2019 .etc'
  )
  .argument(
    '[files...]',
    'a glob of files to to test the EcmaScript version against(dist/**/*.js dist/**/*.html)'
  )
  .option('-M,--module', 'use ES modules')
  .option(
    '--allow-hash-bang',
    'if the code starts with #! treat it as a comment'
  )
  .option('-E,--exit-code <code>', 'with Error set process.exit(code)')
  .option('-O,--out [filename]', 'output error message to [filename].log file')
  .action(startCommand)

program.parse(process.argv)
