import { afterEach, describe, expect, it, vi } from 'vitest'

import { daysFromTodayInputValue, todayInputValue } from '../appHelpers'

describe('date input defaults', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('derives action and schedule dates from the current local day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 26, 12, 0, 0))

    expect(todayInputValue()).toBe('2026-07-26')
    expect(daysFromTodayInputValue(7)).toBe('2026-08-02')
  })
})
