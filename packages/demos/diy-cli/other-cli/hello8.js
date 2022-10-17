const inquirer = require('inquirer')

inquirer
  .prompt([
    {
      type: 'checkbox',
      message: '水果选择',
      name: 'fruits',
      choices: [
        {
          name: '🍌'
        },
        {
          name: '🍉'
        },
        {
          name: '🍇'
        }
      ]
    }
  ])
  .then((answers) => {
    console.log(answers)
  })
