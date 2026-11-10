import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { RemoteSelect } from '@/shared/ui/RemoteSelect'

describe('RemoteSelect', () => {
  it('搜索无结果时仍显示 initialOption 回填的旧值', async () => {
    const fetchOptions = vi.fn().mockResolvedValue([])

    render(
      <RemoteSelect
        fetchOptions={fetchOptions}
        value="legacy-customer"
        initialOption={{ label: '历史客户（已停用）', value: 'legacy-customer' }}
        onChange={() => undefined}
      />,
    )

    expect(await screen.findByText('历史客户（已停用）')).toBeTruthy()
    expect(fetchOptions).toHaveBeenCalledWith('')
  })
})
