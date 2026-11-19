import { describe, expect, it, vi } from 'vitest'

vi.mock('antd', () => ({
  Modal: { error: vi.fn() },
  message: { error: vi.fn(), warning: vi.fn(), success: vi.fn() },
}))

import { message } from 'antd'
import { showErrorDialog } from '@/shared/errors'

const messageError = vi.mocked(message.error)

describe('showErrorDialog 网络异常文案', () => {
  it('把 Failed to fetch 替换为可读的中文网络提示', () => {
    showErrorDialog(new TypeError('Failed to fetch'), '保存失败')

    expect(messageError).toHaveBeenCalledTimes(1)
    const content = String(messageError.mock.calls[0][0])
    expect(content).not.toContain('Failed to fetch')
    expect(content).toContain('网络')
  })

  it('保留业务错误自身的可读文案', () => {
    showErrorDialog(new Error('出货单已生成出库计划，不能撤回'), '保存失败')

    expect(String(messageError.mock.calls.at(-1)?.[0])).toBe('出货单已生成出库计划，不能撤回')
  })
})
