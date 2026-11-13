import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api', () => ({
  getPurchaseContract: vi.fn(),
  listPurchaseContractReminders: vi.fn().mockResolvedValue({ items: [] }),
  listPurchaseContracts: vi.fn(),
}))

import { getPurchaseContract, listPurchaseContracts, type PurchaseContract } from '@/api'
import { ApiError } from '@/shared/errors'
import { purchaseContractPath } from '@/app/routes'
import { usePurchaseContractsList } from '@/app/pages/purchase/hooks/usePurchaseContractsList'

const emptySummary = {
  total_count: 0,
  submitted_count: 0,
  approved_count: 0,
  total_amount: '0.00',
}

function makeContract(id: string): PurchaseContract {
  return {
    id,
    code: `PC-${id}`,
    supplier_id: 'supplier-001',
    supplier_name: '华东包装制品厂',
    contract_date: '2026-08-05',
    delivery_date: '2026-08-30',
  } as PurchaseContract
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

describe('usePurchaseContractsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, '', '/purchase/contracts')
  })

  it('详情记录不在第一页时仍按 ID 请求并展示', async () => {
    const contract = makeContract('pc-page-2')
    vi.mocked(listPurchaseContracts).mockResolvedValue({
      items: [makeContract('pc-page-1')],
      total: 1,
      summary: emptySummary,
    } as never)
    vi.mocked(getPurchaseContract).mockResolvedValue(contract)

    const { result } = renderHook(() =>
      usePurchaseContractsList({ detailId: contract.id, onNavigate: vi.fn() }),
    )

    await waitFor(() => expect(getPurchaseContract).toHaveBeenCalledWith('pc-page-2'))
    await waitFor(() => expect(result.current.selectedContract?.id).toBe('pc-page-2'))
    expect(result.current.detailLoading).toBe(false)
  })

  it('详情接口返回 404 时才退回列表', async () => {
    const onNavigate = vi.fn()
    vi.mocked(listPurchaseContracts).mockResolvedValue({
      items: [],
      total: 0,
      summary: emptySummary,
    } as never)
    vi.mocked(getPurchaseContract).mockRejectedValue(
      new ApiError('采购合同不存在', 'not_found', 'not found', 404),
    )

    renderHook(() => usePurchaseContractsList({ detailId: 'pc-missing', onNavigate }))

    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith(purchaseContractPath))
  })

  it('晚到的旧响应不覆盖新查询结果，也不提前关闭 loading', async () => {
    const older = deferred<never>()
    const newer = deferred<never>()
    vi.mocked(listPurchaseContracts)
      .mockReturnValueOnce(older.promise as never)
      .mockReturnValueOnce(newer.promise as never)

    const { result } = renderHook(() =>
      usePurchaseContractsList({ detailId: null, onNavigate: vi.fn() }),
    )

    await waitFor(() => expect(listPurchaseContracts).toHaveBeenCalledTimes(1))

    act(() => {
      result.current.setSearch('铝箔')
      result.current.submitFilters()
    })
    await waitFor(() => expect(listPurchaseContracts).toHaveBeenCalledTimes(2))

    await act(async () => {
      newer.resolve({
        items: [makeContract('pc-new')],
        total: 1,
        summary: emptySummary,
      } as never)
    })
    await waitFor(() => expect(result.current.contracts[0]?.id).toBe('pc-new'))
    expect(result.current.loading).toBe(false)

    await act(async () => {
      older.resolve({
        items: [makeContract('pc-old')],
        total: 99,
        summary: emptySummary,
      } as never)
    })

    expect(result.current.contracts[0]?.id).toBe('pc-new')
    expect(result.current.total).toBe(1)
    expect(result.current.loading).toBe(false)
  })
})
