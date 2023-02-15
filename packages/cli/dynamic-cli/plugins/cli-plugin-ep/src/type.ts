export type ActionType = 'client' | 'server' | 'admin'

export interface Options {
  check?: boolean
  pack?: string | boolean
  upload?: boolean
  pull?: string | boolean
  unpkg?: string | boolean
  deploy?: string | boolean
  restart?: string
  start?: string
  stop?: string
  status?: string
  log?: string
}
