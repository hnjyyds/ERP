import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiMocks = vi.hoisted(() => ({
  listCustomers: vi.fn(),
  listProducts: vi.fn(),
  listSuppliers: vi.fn(),
  listAssignableUsers: vi.fn(),
}))

vi.mock('@/api', () => apiMocks)

import { useExportContractOptions } from '@/app/pages/sales/hooks/useExportContractOptions'
import { usePurchaseContractOptions } from '@/app/pages/purchase/hooks/usePurchaseContractOptions'

describe('主数据下拉改服务端搜索', () => {
  beforeEach(() => {
    apiMocks.listCustomers.mockReset().mockResolvedValue({ items: [], total: 0 })
    apiMocks.listProducts.mockReset().mockResolvedValue({ items: [], total: 0 })
    apiMocks.listSuppliers.mockReset().mockResolvedValue({ items: [], total: 0 })
    apiMocks.listAssignableUsers.mockReset().mockResolvedValue({ users: [] })
  })

  it('出口合同首次加载只请求启用客户与前 20 条商品', async () => {
    renderHook(() => useExportContractOptions())

    await waitFor(() => {
      expect(apiMocks.listCustomers).toHaveBeenCalledWith({
        q: undefined,
        status: 'active',
        limit: 20,
      })
      expect(apiMocks.listProducts).toHaveBeenCalledWith({ q: undefined, limit: 20 })
    })
  })

  it('输入关键字后按关键字重新请求，而不是本地截断', async () => {
    const { result } = renderHook(() => useExportContractOptions())

    await act(async () => {
      await result.current.loadCustomers('bag')
      await result.current.loadProducts('eco')
    })

    expect(apiMocks.listCustomers).toHaveBeenLastCalledWith({
      q: 'bag',
      status: 'active',
      limit: 20,
    })
    expect(apiMocks.listProducts).toHaveBeenLastCalledWith({ q: 'eco', limit: 20 })
  })

  it('采购合同首次加载只请求启用工厂与前 20 条商品', async () => {
    renderHook(() => usePurchaseContractOptions())

    await waitFor(() => {
      expect(apiMocks.listSuppliers).toHaveBeenCalledWith({
        q: undefined,
        status: 'active',
        limit: 20,
      })
      expect(apiMocks.listProducts).toHaveBeenCalledWith({ q: undefined, limit: 20 })
    })
  })
})
