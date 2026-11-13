import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import * as api from '@/api'
import { usePurchaseContractsList } from '@/app/pages/purchase/hooks/usePurchaseContractsList'
import { useExportContractsList } from '@/app/pages/sales/hooks/useExportContractsList'
import { useProductsPage } from '@/app/pages/masterdata/products/hooks/useProductsPage'
const summary = { submitted_count: 0, approved_count: 0, total_amount: '0', currency: 'USD', with_image_count: 0, accessory_count: 0 }
const packet = (id: string) => ({ items: [{ id, code: id, accessories: [] }], total: 51, summary })
beforeEach(() => {
 vi.restoreAllMocks(); window.history.replaceState({}, '', '/')
 vi.stubGlobal('fetch', vi.fn(() => { throw new Error('AUDIT: real network forbidden') }))
 vi.spyOn(api, 'listPurchaseContractReminders').mockResolvedValue({ items: [], total: 0 })
})
afterEach(() => { cleanup(); expect(globalThis.fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals() })
for (const [name, fn, hook, path] of [
 ['purchase', 'listPurchaseContracts', usePurchaseContractsList, '/purchase/contracts'],
 ['export', 'listExportContracts', useExportContractsList, '/sales/contracts'],
 ['product', 'listProducts', useProductsPage, '/masterdata/products'],
] as const) {
 it(`valid ${name} detail outside page 1 must not redirect to list`, async () => {
  vi.spyOn(api, fn).mockResolvedValue(packet('first-page-record') as never)
  const navigate = vi.fn()
  const { result } = renderHook(() => hook({ detailId: 'record-51', onNavigate: navigate }))
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(navigate).not.toHaveBeenCalledWith(path)
 })
}
it('delayed older purchase query must not replace latest query result', async () => {
 let oldResolve!: (value: unknown) => void, newResolve!: (value: unknown) => void
 const older = new Promise<unknown>((resolve) => { oldResolve = resolve })
 const newer = new Promise<unknown>((resolve) => { newResolve = resolve })
 vi.spyOn(api, 'listPurchaseContracts').mockImplementation((f) => {
  if (f?.q === 'older') return older as never
  if (f?.q === 'newer') return newer as never
  return Promise.resolve(packet('initial')) as never
 })
 const { result } = renderHook(() => usePurchaseContractsList({ detailId: null, onNavigate: vi.fn() }))
 await waitFor(() => expect(result.current.contracts[0]?.id).toBe('initial'))
 act(() => result.current.setSearch('older')); act(() => result.current.submitFilters())
 act(() => result.current.setSearch('newer')); act(() => result.current.submitFilters())
 await act(async () => { newResolve(packet('latest-result')); await newer })
 expect(result.current.contracts[0]?.id).toBe('latest-result')
 await act(async () => { oldResolve(packet('outdated-result')); await older })
 expect(result.current.contracts[0]?.id).toBe('latest-result')
})
