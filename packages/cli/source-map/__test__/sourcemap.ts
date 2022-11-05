// npx esno sourcemap.ts
import fs from 'fs'
import path from 'path'
import sourceMap from 'source-map'

const mapContent = fs.readFileSync(
  path.resolve(__dirname, './test-files/index.9bb0da5c.js.map'),
  'utf-8'
)

function createSourceMapConsumer(sourceMapCode: string) {
  const consumer = new sourceMap.SourceMapConsumer(sourceMapCode)
  return consumer
}

;(async () => {
  const consumer = await createSourceMapConsumer(mapContent)

  // [
  // '../../vite/modulepreload-polyfill',
  // '../../node_modules/.pnpm/@vue+shared@3.2.37/node_modules/@vue/shared/dist/shared.esm-bundler.js',
  // 类似的源文件路径
  // ]
  const sourceFileNames = consumer.sources

  // 源文件个数
  const sourceCount = sourceFileNames.length

  // 第一个源文件的内容
  const sourceCode = consumer.sourceContentFor(sourceFileNames[0])

  // 通过压缩混淆后的代码的行列号，定位到源文件
  const sourceInfo = consumer.originalPositionFor({
    line: 24,
    column: 17596
  })
  // 这个例子的结果如下
  console.log(sourceInfo)
  //   {
  //     source: '../../node_modules/.pnpm/vue-router@4.0.14_vue@3.2.37/node_modules/vue-router/dist/vue-router.esm-bundler.js',
  //     line: 2882,
  //     column: 12,
  //     name: null
  //   }
})()
