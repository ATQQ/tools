import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Command } from 'commander'
import definePlugin from '../src/index'
import * as cliConfig from '@sugarat/cli'
import { currentWikiNum } from '../src/util'

vi.mock('@sugarat/cli', async () => {
  const actual = await vi.importActual('@sugarat/cli') as any
  return {
    ...actual,
    getCLIConfig: vi.fn(),
    setCLIConfig: vi.fn(),
  }
})

describe('cli-plugin-blog reset-num', () => {
  let logSpy: any

  beforeEach(() => {
    vi.clearAllMocks()
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('should have --reset-num option', () => {
    const plugin = definePlugin() as any
    const program = new Command()
    
    // 模拟注册命令
    plugin.command(program)
    
    const cmd = program.commands.find((c) => c.name() === 'blog')
    expect(cmd).toBeDefined()
    
    const option = cmd?.options.find((opt) => opt.long === '--reset-num')
    expect(option).toBeDefined()
    expect(option?.description).toBe('重置当前周刊期数')
  })

  it('should handle reset-num correctly when provided a number', async () => {
    const plugin = definePlugin() as any
    const program = new Command()
    program.exitOverride()
    plugin.command(program)
    
    await program.parseAsync(['node', 'test', 'blog', '--reset-num', '100'])
    
    expect(cliConfig.setCLIConfig).toHaveBeenCalledWith(currentWikiNum, 100)
    expect(logSpy).toHaveBeenCalledWith('周刊期数已重置为: 100')
  })

  it('should print error when reset-num is not a valid number', async () => {
    const plugin = definePlugin() as any
    const program = new Command()
    program.exitOverride()
    plugin.command(program)
    
    await program.parseAsync(['node', 'test', 'blog', '--reset-num', 'abc'])
    
    expect(cliConfig.setCLIConfig).not.toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalledWith('请输入数字作为周刊序号')
  })
})