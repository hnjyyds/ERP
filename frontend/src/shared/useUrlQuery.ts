import { useCallback, useEffect, useMemo, useState } from 'react'

const urlQueryChangeEvent = 'xinpei:url-query-change'

export type UrlQueryPatch = Record<string, string | number | null | undefined>

function currentSearch(): string {
  return window.location.search
}

export function notifyUrlQueryChange() {
  window.dispatchEvent(new Event(urlQueryChangeEvent))
}

/** 读取页码参数；非法值回退到第 1 页。 */
export function parsePageParam(params: URLSearchParams): number {
  const value = Number(params.get('page'))
  return Number.isInteger(value) && value > 0 ? value : 1
}

/**
 * 列表筛选的 URL 状态。
 * 读取当前查询参数，写入时只替换查询串（不改路径），并在浏览器前进/后退时通知页面重新读取。
 */
export function useUrlQuery() {
  const [search, setSearch] = useState(currentSearch)

  useEffect(() => {
    const sync = () => setSearch(currentSearch())
    window.addEventListener('popstate', sync)
    window.addEventListener(urlQueryChangeEvent, sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener(urlQueryChangeEvent, sync)
    }
  }, [])

  const params = useMemo(() => new URLSearchParams(search), [search])

  const update = useCallback((patch: UrlQueryPatch, options?: { replace?: boolean }) => {
    const next = new URLSearchParams(window.location.search)
    for (const [key, raw] of Object.entries(patch)) {
      const value = raw === null || raw === undefined ? '' : String(raw).trim()
      if (value) next.set(key, value)
      else next.delete(key)
    }
    const nextSearch = next.toString() ? `?${next.toString()}` : ''
    const url = `${window.location.pathname}${nextSearch}`
    if (options?.replace === false) window.history.pushState({}, '', url)
    else window.history.replaceState({}, '', url)
    setSearch(nextSearch)
    notifyUrlQueryChange()
    return nextSearch
  }, [])

  return { search, params, update }
}
