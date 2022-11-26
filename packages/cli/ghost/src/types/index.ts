export interface GhostOptions {
  /**
   * need exclude pkg pattern
   */
  exclude?: ExcludePattern | ExcludePattern[]
  /**
   * include node lib {fs, path, etc}
   * @default false
   */
  includeNodeLib?: boolean
  /**
   * need exclude scan files pattern
   */
  excludeFilePattern?: string | string[]
}

export type ExcludePattern = string | RegExp
