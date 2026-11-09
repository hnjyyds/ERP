import { describe, expect, it } from 'vitest'

import { parsePageParam } from '@/shared/useUrlQuery'

describe('parsePageParam', () => {
  it.each(['0', '-1', '1.5', 'abc', ''])(
    'page=%s 不是正整数时回退到第一页',
    (value) => {
      expect(parsePageParam(new URLSearchParams({ page: value }))).toBe(1)
    },
  )

  it('缺少 page 参数时回退到第一页', () => {
    expect(parsePageParam(new URLSearchParams())).toBe(1)
  })

  it('正整数页码原样返回', () => {
    expect(parsePageParam(new URLSearchParams({ page: '3' }))).toBe(3)
  })

  it('支持自定义参数名，避免同页多列表互相覆盖', () => {
    const params = new URLSearchParams({ page: '2', inbound_page: '4' })

    expect(parsePageParam(params)).toBe(2)
    expect(parsePageParam(params, 'inbound_page')).toBe(4)
  })
})
