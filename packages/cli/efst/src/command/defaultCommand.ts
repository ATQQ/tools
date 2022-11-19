import cliProgress from 'cli-progress'
import { CLIOptions } from '../types'
import {
  downloadByUrl,
  formatSize,
  redStr,
  underlineStr,
  yellowStr,
  getSpeedCalculator,
  getCLIConfig
} from '../util'

export default function defaultCommand(url: string, options: CLIOptions) {
  const cliConfig = getCLIConfig()
  const { filename, location, timeout, proxy, override } = {
    ...cliConfig,
    ...options
  } as CLIOptions

  const progressBar = new cliProgress.SingleBar(
    {
      format:
        '[{bar}] {percentage}% | ETA: {eta}s | {rec}/{sum} | Speed {speed}',
      barsize: 16
    },
    cliProgress.Presets.shades_classic
  )
  const speed = getSpeedCalculator()

  downloadByUrl(url, {
    maxRedirects: +location,
    timeout: +timeout,
    proxy,
    override,
    filename
  })
    .progress((cur, rec, sum) => {
      // 初始化
      if (progressBar.getProgress() === 0) {
        progressBar.start(sum, 0, {
          sum: formatSize(sum)
        })
      }

      // 更新进度
      progressBar.update(rec, {
        rec: formatSize(rec),
        speed: speed(cur)
      })

      // 结束
      if (rec === sum) {
        progressBar.stop()
      }
    })
    .error((err) => {
      console.log('error url:', url)
      console.log('error msg:', redStr(err.message))
      process.exit()
    })
    .end((filepath) => {
      console.log('file save:', underlineStr(yellowStr(filepath)))
    })
}
