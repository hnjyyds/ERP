import { useState } from 'react'

import { t } from '@/app/appI18n'

const DEFAULT_PAGE_SIZE = 50
const PAGE_SIZE_OPTIONS = [20, 50, 100]

/**
 * 服务端分页状态。调用方负责用 page/pageSize 计算 limit/offset 并写入 total。
 * changePage 会返回本次变更后的页码与每页条数，避免 setState 异步导致请求用到旧值。
 */
export function useTablePagination(
  initialPageSize = DEFAULT_PAGE_SIZE,
  initialPage = 1,
) {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [total, setTotal] = useState(0)

  function changePage(nextPage: number, nextPageSize: number) {
    const sizeChanged = nextPageSize !== pageSize
    const resolved = sizeChanged ? 1 : nextPage
    setPageSize(nextPageSize)
    setPage(resolved)
    return { page: resolved, pageSize: nextPageSize }
  }

  function resetPage() {
    setPage(1)
  }

  return {
    page,
    pageSize,
    total,
    setTotal,
    setPage,
    resetPage,
    changePage,
    pagination: {
      current: page,
      pageSize,
      total,
      showSizeChanger: true,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
      showTotal: (count: number) => t('common.pagination.total', { count }),
    },
  }
}
