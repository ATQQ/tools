import path from 'path'
import {
  getSourceCode,
  getSourceMapFilePath,
  getSourcesBySourceMapCode,
  outPutSources,
  yellowStr
} from '../util'

interface Options {
  sourceMap?: boolean
  output?: boolean | string
}

export default async function sourcesCommand(
  sourceUrl: string,
  options: Options
) {
  let url = sourceUrl
  if (!options.sourceMap) {
    url = (await getSourceMapFilePath(url))!
  }
  const sourceMapCode = await getSourceCode(url)
  const sources = await getSourcesBySourceMapCode(sourceMapCode)
  const outputDir = path.resolve(
    process.cwd(),
    path.basename(url),
    options.output === true ? './' : options.output || './'
  )
  console.log(sources.length, 'files')
  console.log('output dir', yellowStr(outputDir))

  await outPutSources(sources, outputDir)
}
