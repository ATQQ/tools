export type ActionType = 'server' | 'deploy' | 'check'

export interface Options {
  check?: boolean
  pack?: string | boolean
  upload?: boolean
  pull?: string | boolean
  unpkg?: string | boolean
  deploy?: string | boolean
  initMysql: string[]
  name?: string
  restart?: boolean
  stop?: boolean
  del?: boolean
  list?: boolean
  status?: boolean
  log?: boolean
  config?: string
}

export interface RegistryInfo {
  _id: string
  _rev: string
  'dist-tags': Disttags
  name: string
  time: Time
  versions: Versions
  description: string
  maintainers: NpmUser[]
  readme: string
  _source_registry_name: string
}

type Versions = Record<string, Version>

export interface Version {
  name: string
  version: string
  scripts: Record<string, string>
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  _id: string
  readmeFilename: string
  gitHead: string
  description: string
  _nodeVersion: string
  _npmVersion: string
  dist: Dist
  _npmUser: NpmUser
  _npmOperationalInternal: NpmOperationalInternal
  _hasShrinkwrap: boolean
  _cnpmcore_publish_time: string
  publish_time: number
  _source_registry_name: string
}

interface NpmOperationalInternal {
  host: string
  tmp: string
}

interface NpmUser {
  name: string
  email: string
}

interface Dist {
  integrity: string
  shasum: string
  tarball: string
  fileCount: number
  unpackedSize: number
  signatures: Signature[]
  size: number
}

interface Signature {
  keyid: string
  sig: string
}

interface Time {
  created: string
  modified: string
  [key: string]: string
}

interface Disttags {
  beta: string
  latest: string
}
