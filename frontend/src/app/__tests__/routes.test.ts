import { describe, expect, it } from 'vitest'

import {
  canAccessPath,
  dashboardPath,
  financeReportsPath,
  navChildrenForGroup,
  navPathsForGroup,
  productPath,
  routeDefinitionFor,
  routeRegistry,
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

  it('does not let the dashboard root absorb unrelated paths', () => {
    expect(canAccessPath(productPath, [dashboardPath])).toBe(false)
    expect(canAccessPath('/', [dashboardPath])).toBe(true)
  })
})

describe('route registry', () => {
  it('keeps every registered path unique', () => {
    const paths = routeRegistry.map((route) => route.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('resolves the longest entry for detail paths', () => {
    expect(routeDefinitionFor(`${shipmentPath}/shipment-1`)?.path).toBe(shipmentPath)
    expect(routeDefinitionFor(`${financeReportsPath}/report-1`)?.path).toBe(financeReportsPath)
  })

  it('derives sidebar paths and finance children from the registry', () => {
    expect(navPathsForGroup('masterdata')).toEqual([
      productPath,
      '/masterdata/suppliers',
      '/masterdata/customers',
      '/masterdata/partners',
      '/masterdata/document-parties',
    ])
    expect(navChildrenForGroup('finance').map((child) => child.path)).toContain(
      financeReportsPath,
    )
  })
})
