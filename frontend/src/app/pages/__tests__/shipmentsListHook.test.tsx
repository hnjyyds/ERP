import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api', () => ({
  listShipments: vi.fn(),
  listShipmentReminders: vi.fn().mockResolvedValue({ items: [] }),
}))

import { listShipments } from '@/api'
import { useShipmentsList } from '@/app/pages/sales/hooks/useShipmentsList'

const emptyResult = {
  items: [],
  total: 0,
  summary: {
    submitted_count: 0,
    approved_count: 0,
    receivable_amount: '0',
    profit_amount: '0',
    currency: null,
  },
}

describe('useShipmentsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(listShipments).mockResolvedValue(emptyResult as never)
    window.history.replaceState({}, '', '/sales/shipments')
  })

  it('读取客户下钻 URL 的 customer_id 并回填客户筛选', async () => {
    window.history.replaceState({}, '', '/sales/shipments?customer_id=customer-1')

    const { result } = renderHook(() =>
      useShipmentsList({ detailId: null, onNavigate: vi.fn() }),
    )

    await waitFor(() =>
      expect(listShipments).toHaveBeenCalledWith(
        expect.objectContaining({ customer_id: 'customer-1' }),
      ),
    )
    expect(result.current.customerFilter).toBe('customer-1')
    await act(async () => {})
  })

  it('提交客户筛选时写入统一参数 customer_id 并清理旧参数', async () => {
    window.history.replaceState({}, '', '/sales/shipments?customer=old-customer')

    const { result } = renderHook(() =>
      useShipmentsList({ detailId: null, onNavigate: vi.fn() }),
    )

    await waitFor(() => expect(result.current.customerFilter).toBe('old-customer'))

    act(() => result.current.setCustomerFilter('customer-2'))
    await act(async () => {
      result.current.submitFilters()
    })

    expect(window.location.search).toContain('customer_id=customer-2')
    expect(window.location.search).not.toContain('customer=old-customer')
  })
})
