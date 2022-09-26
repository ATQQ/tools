export interface ParserOptions {
  /**
   * @default '5'
   */
  ecmaVersion?:
    | '3'
    | '5'
    | '6'
    | '7'
    | '8'
    | '9'
    | '10'
    | '11'
    | '12'
    | '13'
    | '14'
    | '2015'
    | '2016'
    | '2017'
    | '2018'
    | '2019'
    | '2020'
    | '2021'
    | '2022'
    | '2023'
    | 'latest'
  /**
   * @default 'script'
   */
  sourceType?: 'module' | 'script'
  /**
   * @default false
   */
  allowHashBang?: boolean
}

export interface LocLine {
  line: number
  column: number
}

export interface CodeError {
  start: number
  end: number
  loc: {
    start: LocLine
    end: LocLine
  }
  source: string
  message: string
}

export interface FileError extends CodeError {
  file: string
  sourceMap?: SourceMapInfo
}

export interface SourceMapInfo {
  file: string
  // TODO:待定
  loc: {
    start: LocLine
    end: LocLine
  }
  source: string
}
