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
}

export type ExcludePattern = string | RegExp
