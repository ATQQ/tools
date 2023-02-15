export type ActionType = 'client' | 'server' | 'admin'

export interface Options {
  check?: boolean
  pack?: string | boolean
  upload?: boolean
  pull?: string | boolean
  unpkg?: string | boolean
  deploy?: string | boolean
  name?: string
  restart?: boolean
  start?: boolean
  stop?: boolean
  del?: boolean
  status?: boolean
  log?: boolean
}
