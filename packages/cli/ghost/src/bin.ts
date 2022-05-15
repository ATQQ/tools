import { Command } from 'commander'
import pkg from '../package.json'
import { scanCommand } from './command'

const program = new Command()
program.version(pkg.version)

program
  .command('scan [paths...]')
  .description('Scan a directory or file for phantom dependency')
  .alias('s')
  .option('-p, --pkg <path>', 'set package.json path')
  .action(scanCommand)

program.parse(process.argv)
