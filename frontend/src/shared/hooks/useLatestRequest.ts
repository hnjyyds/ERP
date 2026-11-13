import { useCallback, useEffect, useRef } from 'react'

type LatestRequest = {
  /** 开始一次请求，返回本次请求序号。 */
  begin: () => number
  /** 判断响应是否仍属于最后一次请求。 */
  isLatest: (requestId: number) => boolean
}

/**
 * 列表请求序号守卫：晚到的旧响应不再覆盖更新的查询结果。
 *
 * 用法：请求发出前 `begin()` 取号，响应返回后先判断 `isLatest(id)`，
 * 只允许最新一次请求写入列表、总数与 loading 状态。
 */
export function useLatestRequest(): LatestRequest {
  const requestIdRef = useRef(0)

  useEffect(
    () => () => {
      requestIdRef.current += 1
    },
    [],
  )

  const begin = useCallback(() => {
    requestIdRef.current += 1
    return requestIdRef.current
  }, [])

  const isLatest = useCallback((requestId: number) => requestIdRef.current === requestId, [])

  return { begin, isLatest }
}
