/* eslint-disable regexp/no-unused-capturing-group */
import fs from 'fs/promises'
import path from 'path'
import process from 'process'
import { existsSync } from 'fs'
import { getCLIConfig, setCLIConfig } from '@sugarat/cli'
import type { PLATFORM } from './type'

export const weeklyDirectoryKey = 'blog.weeklyDirectory'

export function isIncludeTargetPlatform(platform: string) {
  const platformList: PLATFORM[] = ['juejin', 'mdnice', 'cnblogs']
  return platformList.includes(platform as unknown as PLATFORM)
}
export function pipelineString(
  input: string,
  ...fns: ((v: string) => string)[]
) {
  return fns.reduce((pre, fn) => {
    return fn(pre)
  }, input)
}

export function pipeMdNice(input: string, type: PLATFORM) {
  if (type !== 'mdnice')
    return input
  return pipelineString(
    input,
    clearMatterContent,
    removeFirstH1,
    clearStartEndEmptyLine,
    link2footnote,
  )
}
export function link2footnote(md: string) {
  const white = ['mp.weixin.qq.com']
  return md.replace(/([^!])\[(.*?)\]\((.*?)\)/g, (all, $1: string, $2, $3) => {
    if (white.find(v => $3.includes(v))) {
      return all
    }
    return `${$1}[${$2}](${$3} "${$2}")`
  })
}

export function pipeJueJin(input: string, type: PLATFORM) {
  if (type !== 'juejin')
    return input

  return pipelineString(
    input,
    clearMatterContent,
    removeFirstH1,
    clearStartEndEmptyLine,
    v => `---\ntheme: smartblue\n---\n${v}`,
  )
}

export function pipeCnBlogs(input: string, type: PLATFORM) {
  if (type !== 'cnblogs')
    return input

  return pipelineString(
    input,
    clearMatterContent,
    removeFirstH1,
    clearStartEndEmptyLine,
  )
}

export function removeFirstH1(input: string) {
  return input.replace(/#\s.*\n/, '')
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
      }
      else if (second___ === undefined) {
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

  // 提取23级别标题，过滤掉趣图和推荐板块
  const titles = lines.reduce<string[]>((pre, line) => {
    const excludeWords = ['趣图', '强力推荐关注']
    if (
      !excludeWords.find(exclude => line.includes(exclude))
      && /^(##|###)\s/.test(line)
    ) {
      pre.push(line)
    }
    return pre
  }, [])

  // 生成目录
  const toc = titles
    .reduce<string[]>((pre, title) => {
      if (/^##\s/.test(title)) {
        pre.push('', title, '')
      }
      else {
        pre.push(title.replace(/\[(.*?)\]\(.*\)/, '$1'))
      }
      return pre
    }, [])
    .map(v => v.replace(/^#+\s/, ''))
    .join('\n')

  return (
    input
      // 替换目录
      .replace('\n[[toc]]', toc)
      // 替换引导文案
      .replace(
        '**ღ( ´･ᴗ･` )比心**',
        `，预计阅读时间 ${predictReadTime(input)} 分钟`,
      )
      // 底部内容替换
      .replace(
        /## ⭐️强力推荐关注([\s\S]*)/,
        type === 'mdnice'
          ? '## [🔗强力推荐关注](https://mp.weixin.qq.com/s?__biz=MzA4ODMyMTk5OA==&mid=2247484332&idx=1&sn=d0d26fcb72bf420ce3c8a983142f5158&chksm=902ab90da75d301b54dc68609ea01df32280d3bde48270a97f8c1be444915df5ae957d47e7db#rd)$1'
          : '## ⭐️强力推荐关注$1',
      )
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
  return ~~((n / 275) * 60)
}
const pattern
  = /[\w\u0392-\u03C9\u00C0-\u00FF\u0600-\u06FF\u0400-\u04FF]+|[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u3040-\u309F\uAC00-\uD7AF]+/g

// copy from https://github.com/youngjuning/vscode-juejin-wordcount/blob/main/count-word.ts
export default function countWord(data: string) {
  const m = data.match(pattern)
  let count = 0
  if (!m) {
    return 0
  }
  for (let i = 0; i < m.length; i += 1) {
    if (m[i].charCodeAt(0) >= 0x4E00) {
      count += m[i].length
    }
    else {
      count += 1
    }
  }
  return count
}

export function getCircleNumber(num: number) {
  if (num >= 1 && num <= 20) {
    // 数字在 1 到 20 之间，使用 Unicode 码点将数字转换为带圆圈数字形式
    const circle: Record<string, string> = {
      1: '\u2460',
      2: '\u2461',
      3: '\u2462',
      4: '\u2463',
      5: '\u2464',
      6: '\u2465',
      7: '\u2466',
      8: '\u2467',
      9: '\u2468',
      10: '\u2469',
      11: '\u246A',
      12: '\u246B',
      13: '\u246C',
      14: '\u246D',
      15: '\u246E',
      16: '\u246F',
      17: '\u2470',
      18: '\u2471',
      19: '\u2472',
      20: '\u2473',
    }
    return circle[num.toString()] || num.toString()
  }
  // 数字大于 20，使用 Unicode 码点将数字转换为带圆圈数字形式
  const circleCodePoint = 0x324F // 第一个圆圈数字的 Unicode 码点为 0x324F
  const nums = num.toString().split('')
  let result = ''
  nums.forEach((n) => {
    const codePoint = circleCodePoint + Number.parseInt(n, 10)
    result += String.fromCodePoint(codePoint)
  })
  return result
}

/**
 * 自动添加三级标题
 */
export function autoAddH3Num(content: string) {
  let index = 0
  return content.replace(/^#{3} (.*)/gm, (_, $1: string) => {
    index += 1
    // 判断是否有正确的序号
    const numPattern = new RegExp(`^\\[?${index}.`)
    const isRightNum = numPattern.test($1)
    if (isRightNum) {
      return _
    }

    return `### ${$1
      // 先去掉序号开头的内容
      .replace(/^(\[?)\d\.\s?/, '$1')
      // 再填充序号
      .replace(/^(\[?)(.*?)/, `$1${index}. $2`)}`
  })
}

export function autoAddDescription(content: string) {
  const needDescription = /description:(\s*?)$/m.test(content)
  if (needDescription) {
    const h3Titles = content.match(/^#{3} (.*)/gm)
    const titleWithCircleNum = h3Titles?.map((v, idx) =>
      pipelineString(
        v,
        // 去除外链
        (pre) => {
          return pre.replace(/\[([^\]]+)\]\((https?:\/\/\S+)\)/g, '$1')
        },
        // 去除标题和序号
        (pre) => {
          return pre.replace(/^#{3}\s+\d+\.\s/, '')
        },
        // 添加序号,
        (pre) => {
          return `${getCircleNumber(idx + 1)} ${pre}`
        },
      ),
    )
    return content.replace(
      /(description:)(\s*?)$/m,
      `$1 ${titleWithCircleNum?.join(' ') || ''}`,
    )
  }

  return content
}

export function formatWeeklyContent(content: string) {
  return pipelineString(content, autoAddH3Num, autoAddDescription)
}

export function initTemplateContent(tempStr: string, ops: Record<string, any>) {
  return tempStr.replace(/\{\{([^}]+)\}\}/g, (_, match) => ops[match] || _)
}

export const currentWikiKey = 'blog.current'
export const currentWikiNum = 'blog.currentNum'
export async function createTempFile(
  type: 'weekly' | 'article',
  ops: Record<string, any>,
) {
  if (type === 'weekly') {
    const tempContent = await fs.readFile(
      path.join(__dirname, 'weekly.md'),
      'utf-8',
    )
    // 获取年月是 YYYY-MM-DD
    const date = new Date()
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    // 文件名是 YYYY-MM-DD.md
    const fileName = `${year}-${addZero(month)}-${addZero(day)}.md`
    const weeklyDirectory = getCLIConfig(weeklyDirectoryKey)
    const filePath = path.join(
      existsSync(weeklyDirectory) ? weeklyDirectory : process.cwd(),
      fileName,
    )
    console.log('title:', `视野修炼第${ops.name}期`)
    console.log('创建成功', filePath)
    // 存配置,用于简化配置
    setCLIConfig(currentWikiKey, filePath)
    ops.createTime = `${year}-${addZero(month)}-${addZero(day)}`
    const weeklyWiki = initTemplateContent(tempContent, ops)
    await fs.writeFile(filePath, weeklyWiki)
  }
}

// 实现一个方法自动对一位数补零
export function addZero(num: number) {
  return num < 10 ? `0${num}` : num
}

export async function getWeeklyTitle(filepath: string, platform: PLATFORM) {
  const content = clearMatterContent(await fs.readFile(filepath, 'utf-8'))
  // 获取一级标题
  const title = content.match(/^#\s(.*)/m)?.[1]
  console.log('title', title)
  const [_, suffix] = title?.split('|') || []
  // 获取标题中的数字
  const num = title?.match(/\d+/)?.[0]
  let template = ''
  if (platform === 'juejin') {
    template = '视野修炼-技术周刊第{{num}}期'
  }
  if (platform === 'mdnice') {
    template = '视野修炼-技术周刊第{{num}}期'
  }
  if (platform === 'cnblogs') {
    template = '视野修炼-技术周刊第{{num}}期 '
  }
  return (
    initTemplateContent(template, { num })
    + (suffix ? ` | ${suffix.trim()}` : '')
  )
}

export function getArticleDescription(content: string) {
  const description = content.match(/description:(.*)/)?.[1]
  return description
}
