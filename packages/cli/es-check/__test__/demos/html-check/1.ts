import * as parse5 from 'parse5'

const code = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>

<body>
    <script src="https://cdn.staticfile.org/jquery/3.6.1/jquery.min.js"></script>
    <script>
        var str = 'hello'
        var str2 = 'world'

        const varConst = 'const'
        let varLet = 'let'
        const arrFun = () => {
            console.log('hello world');
        }
        console.log(str, str2, varConst, varLet, arrFun)
    </script>
</body>

</html>`

const htmlAST = parse5.parse(code, {
  sourceCodeLocationInfo: true
})

function traverse(ast: any, traverseSchema: Record<string, any>) {
  traverseSchema?.[ast?.nodeName]?.(ast)
  if (ast?.nodeName !== ast?.tagName) {
    traverseSchema?.[ast?.tagName]?.(ast)
  }
  ast?.childNodes?.forEach((n) => {
    traverse(n, traverseSchema)
  })
}

traverse(htmlAST, {
  script(node: any) {
    const code = `${node.childNodes.map((n) => n.value)}`
    const loc = node.sourceCodeLocation
    if (code) {
      console.log(code)
      console.log(loc)
    }
  }
})
