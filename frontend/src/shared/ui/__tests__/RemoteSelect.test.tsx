import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

  it('连续选择 A、B 时回传各自业务编号', async () => {
    const onChange = vi.fn()

    render(
      <RemoteSelect
        fetchOptions={async () => [
          { value: 'notice-1', label: 'PIN-UIQA-01', description: '测试供应商A' },
          { value: 'notice-2', label: 'PIN-UIQA-02', description: '测试供应商B' },
        ]}
        value={null}
        onChange={onChange}
      />,
    )

    fireEvent.mouseDown(screen.getByRole('combobox'))
    fireEvent.click(await screen.findByText('PIN-UIQA-01'))
    fireEvent.mouseDown(screen.getByRole('combobox'))
    fireEvent.click(await screen.findByText('PIN-UIQA-02'))

    await waitFor(() => {
      expect(onChange).toHaveBeenNthCalledWith(
        1,
        'notice-1',
        expect.objectContaining({ label: 'PIN-UIQA-01' }),
      )
      expect(onChange).toHaveBeenNthCalledWith(
        2,
        'notice-2',
        expect.objectContaining({ label: 'PIN-UIQA-02' }),
      )
    })
  })
})
