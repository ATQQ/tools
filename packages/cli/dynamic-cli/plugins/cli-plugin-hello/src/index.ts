import { defineCommand, ICommandDescription } from '@sugarat/cli'

export default function definePlugin(): ICommandDescription {
  return defineCommand({
    name: 'hello',
    command(program) {
      program
        .command('hello [words...]')
        .description(`say hello 💐`)
        .action((words: string[]) => {
          console.log('hello', ...words)
        })
    }
  })
}
