import { describe, expect, it } from 'vitest'

import {
  canAccessPath,
  dashboardPath,
  financeReportsPath,
  productPath,
  shipmentPath,
} from '../routes'

describe('route access', () => {
  it('allows dashboard subpages only when the dashboard menu is assigned', () => {
    expect(canAccessPath('/workspace/todos', [dashboardPath])).toBe(true)
    expect(canAccessPath('/workspace/todos', [productPath])).toBe(false)
  })

  it('normalizes record details to their assigned module', () => {
    expect(canAccessPath(`${productPath}/product-1`, [productPath])).toBe(true)
    expect(canAccessPath(`${shipmentPath}/shipment-1`, [productPath])).toBe(false)
  })

  it('allows finance child routes only when the finance module is assigned', () => {
    expect(canAccessPath(`${financeReportsPath}/report-1`, ['/finance'])).toBe(true)
    expect(canAccessPath(`${financeReportsPath}/report-1`, [productPath])).toBe(false)
  })
})
