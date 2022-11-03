export interface SourceResult {
  /**
   * 源码
   */
  sourceCode: string
  /**
   * 源码文件路径
   */
  source: string
  /**
   * 行号
   */
  line: number
  /**
   * 列号
   */
  column: number
}
