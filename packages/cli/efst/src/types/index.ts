export interface CLIOptions {
  filename: string
  location: string
  timeout: string
  proxy: string
  override: boolean
}

export interface DownloadOptions {
  filename: string
  maxRedirects: number
  timeout: number
  proxy: string
  override: boolean
}

export type ConfigType = 'set' | 'get' | 'del'
