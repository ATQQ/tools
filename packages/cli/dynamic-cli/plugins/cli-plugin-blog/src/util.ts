/* eslint-disable no-underscore-dangle */
import { PLATFORM } from './type'

export function pipelineString(
  input: string,
  ...fns: ((v: string) => string)[]
) {
  return fns.reduce((pre, fn) => {
    return fn(pre)
  }, input)
}

export function pipeMdNice(input: string, type: PLATFORM) {
  if (type !== 'mdnice') return input
  return pipelineString(
    input,
    clearMatterContent,
    (v) => v.replace(/#\s.*\n/, ''),
    clearStartEndEmptyLine,
    link2footnote
  )
}
export function link2footnote(md: string) {
  const white = ['mp.weixin.qq.com']
  return md.replace(/([^!])\[(.*?)\]\((.*?)\)/g, (all, $1: string, $2, $3) => {
    if (white.find((v) => $3.includes(v))) {
      return all
    }
    return `${$1}[${$2}](${$3} "${$2}")`
  })
}

export function pipeJueJin(input: string, type: PLATFORM) {
  if (type !== 'juejin') return input

  return pipelineString(
    input,
    clearMatterContent,
    (v) => v.replace(/#\s.*\n/, ''),
    clearStartEndEmptyLine,
    (v) => `---\ntheme: smartblue\n---\n${v}`
  )
}

export function clearStartEndEmptyLine(content: string) {
  return content.replace(/^\s+/, '').replace(/\s+$/, '')
}

export function clearMatterContent(content: string) {
  let first___: number | undefined
  let second___: number | undefined

  const lines = content.split('\n').reduce<string[]>((pre, line) => {
    // 移除开头的空白行
    if (!line.trim() && pre.length === 0) {
      return pre
    }
    if (line.trim() === '---') {
      if (first___ === undefined) {
        first___ = pre.length
      } else if (second___ === undefined) {
        second___ = pre.length
      }
    }
    pre.push(line)
    return pre
  }, [])
  return (
    lines
      // 剔除---之间的内容
      .slice((second___ ?? 0) && (second___ ?? 0) + 1)
      .join('\n')
  )
}

export function pipeWeekly(input: string, type: PLATFORM) {
  const lines = input.split('\n')

  //   提取23级别标题，过滤掉趣图和推荐板块
  const titles = lines.reduce<string[]>((pre, line) => {
    const excludeWords = ['趣图', '关注']
    if (
      !excludeWords.find((exclude) => line.includes(exclude)) &&
      /^(##|###)\s/.test(line)
    ) {
      pre.push(line)
    }
    return pre
  }, [])

  //   生成目录
  const toc = titles
    .reduce<string[]>((pre, title) => {
      if (/^##\s/.test(title)) {
        pre.push('', title, '')
      } else {
        pre.push(title.replace(/\[(.*?)\]\(.*\)/, '$1'))
      }
      return pre
    }, [])
    .map((v) => v.replace(/^#+\s/, ''))
    .join('\n')

  return (
    input
      // 替换目录
      .replace('\n[[toc]]', toc)
      // 替换引导文案
      .replace(
        '**ღ( ´･ᴗ･` )比心**',
        `，预计阅读时间 ${predictReadTime(input)} 分钟`
      )
      // 底部内容替换
      .replace(/(## ⭐️强力推荐关注[\s\S]*)/, type === 'mdnice' ? '' : '$1')
  )
}

export function predictReadTime(md: string) {
  const words = countWord(md)
  const images = md.match(/!\[.*?\]\(.*?\)/g)?.length || 0
  return Math.ceil((wordTime(words) + imageTime(images)) / 60)
}

export function imageTime(n: number) {
  if (n <= 10) {
    // 等差数列求和
    return n * 13 + (n * (n - 1)) / 2
  }
  return 175 + (n - 10) * 3
}

export function wordTime(n: number) {
  // eslint-disable-next-line no-bitwise
  return ~~((n / 275) * 60)
}
const pattern =
  /[a-zA-Z0-9_\u0392-\u03c9\u00c0-\u00ff\u0600-\u06ff\u0400-\u04ff]+|[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\uac00-\ud7af]+/g

// copy from https://github.com/youngjuning/vscode-juejin-wordcount/blob/main/count-word.ts
export default function countWord(data: string) {
  const m = data.match(pattern)
  let count = 0
  if (!m) {
    return 0
  }
  for (let i = 0; i < m.length; i += 1) {
    if (m[i].charCodeAt(0) >= 0x4e00) {
      count += m[i].length
    } else {
      count += 1
    }
  }
  return count
}
