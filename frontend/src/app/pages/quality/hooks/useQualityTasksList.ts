import { useEffect, useRef, useState } from 'react'

import {
  listQualityInspections,
  type CurrentUser,
  type QualityInspection,
  type QualityInspectionListSummary,
} from '@/api'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'
import { useTablePagination } from '@/shared/useTablePagination'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'

import { emptySummary, filtersFromUrl, type TaskListFilters } from '../qualityTaskHelpers'

type Params = { currentUser: CurrentUser }

export function useQualityTasksList({ currentUser }: Params) {
  const [tasks, setTasks] = useState<QualityInspection[]>([])
  const [summary, setSummary] = useState<QualityInspectionListSummary>(emptySummary)
  const urlQuery = useUrlQuery()
  const appliedUrlSearchRef = useRef(urlQuery.search)
  const { page, pageSize, total, setTotal, setPage, changePage, pagination } = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params),
  )
  const [statusFilter, setStatusFilter] = useState(() => urlQuery.params.get('status') ?? '')
  const [search, setSearch] = useState(() => urlQuery.params.get('q') ?? '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void loadTasks()
  }, [])

  useEffect(() => {
    if (appliedUrlSearchRef.current === urlQuery.search) return
    appliedUrlSearchRef.current = urlQuery.search
    setSearch(urlQuery.params.get('q') ?? '')
    setStatusFilter(urlQuery.params.get('status') ?? '')
    const nextPage = parsePageParam(urlQuery.params)
    setPage(nextPage)
    void loadTasks(nextPage, pageSize, filtersFromUrl(urlQuery.params))
  }, [urlQuery.search])

  function currentFilters(): TaskListFilters {
    return {
      q: search.trim() || undefined,
      status: statusFilter || undefined,
    }
  }

  async function loadTasks(
    pageOverride?: number,
    pageSizeOverride?: number,
    filtersOverride?: TaskListFilters,
  ) {
    const resolvedPage = pageOverride ?? page
    const resolvedPageSize = pageSizeOverride ?? pageSize
    const filters = filtersOverride ?? currentFilters()
    setLoading(true)
    try {
      const result = await listQualityInspections({
        inspector_user_id: currentUser.id,
        ...filters,
        limit: resolvedPageSize,
        offset: (resolvedPage - 1) * resolvedPageSize,
      })
      setTotal(result.total)
      setSummary(result.summary)
      if (result.items.length === 0 && resolvedPage > 1) {
        const prevPage = resolvedPage - 1
        setPage(prevPage)
        appliedUrlSearchRef.current = urlQuery.update({
          page: prevPage === 1 ? null : prevPage,
        })
        await loadTasks(prevPage, resolvedPageSize, filtersOverride)
        return
      }
      setTasks(result.items)
    } catch (caught) {
      showError(caught, t('quality.task.message.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  function upsertTask(task: QualityInspection) {
    setTasks((current) => current.map((item) => (item.id === task.id ? task : item)))
  }

  function submitFilters() {
    setPage(1)
    appliedUrlSearchRef.current = urlQuery.update({
      q: search.trim(),
      status: statusFilter,
      page: null,
    })
    void loadTasks(1, pageSize)
  }

  function changeListPage(nextPage: number, nextPageSize: number) {
    const next = changePage(nextPage, nextPageSize)
    appliedUrlSearchRef.current = urlQuery.update({
      page: next.page === 1 ? null : next.page,
    })
    void loadTasks(next.page, next.pageSize)
  }

  return {
    tasks,
    summary,
    total,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    loading,
    pagination,
    loadTasks,
    upsertTask,
    submitFilters,
    changeListPage,
  }
}
