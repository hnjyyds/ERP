import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useTablePagination } from '../useTablePagination'

describe('useTablePagination', () => {
  it('切换页码时保留每页条数', () => {
    const { result } = renderHook(() => useTablePagination())

    act(() => {
      result.current.setTotal(123)
    })
    let next: { page: number; pageSize: number } = { page: 1, pageSize: 20 }
    act(() => {
      next = result.current.changePage(2, 20)
    })

    expect(next).toEqual({ page: 2, pageSize: 20 })
    expect(result.current.page).toBe(2)
    expect(result.current.total).toBe(123)
  })

  it('切换每页条数时回到第一页', () => {
    const { result } = renderHook(() => useTablePagination())
    act(() => {
      result.current.changePage(3, 20)
    })

    let next: { page: number; pageSize: number } = { page: 1, pageSize: 20 }
    act(() => {
      next = result.current.changePage(3, 50)
    })

    expect(next).toEqual({ page: 1, pageSize: 50 })
    expect(result.current.page).toBe(1)
    expect(result.current.pageSize).toBe(50)
  })

  it('重置页码回到第一页', () => {
    const { result } = renderHook(() => useTablePagination())
    act(() => {
      result.current.changePage(4, 20)
      result.current.resetPage()
    })

    expect(result.current.page).toBe(1)
  })
})
