import { defineCommand, ICommandDescription } from '@sugarat/cli'

export default function definePlugin(...words: string[]): ICommandDescription {
  return defineCommand({
    name: 'hello',
    command(program) {
      program
        .command('hello')
        .description(`say hello 💐`)
        .action(() => {
          console.log('hello', ...words)
        })
    }
  })
}
