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

describe('route access with seeded role menus', () => {
  // 对应 seed_navigation.py 中按权限过滤后的菜单路径
  const salesManagerMenus = [
    dashboardPath,
    '/masterdata/products',
    '/masterdata/customers',
    '/masterdata/suppliers',
    '/sales/contracts',
    '/purchase/contracts',
    '/quality/inspections',
    '/warehouse/inbound-orders',
  ]
  const financeMenus = [dashboardPath, '/finance', '/reporting']
  const systemAdminMenus = [dashboardPath, '/organization/users', '/system/mcp']
  const purchasePartialMenus = [
    dashboardPath,
    '/masterdata/products',
    '/masterdata/suppliers',
    '/purchase/contracts',
    '/warehouse/inbound-orders',
  ]

  it('blocks finance routes for roles without finance permission', () => {
    expect(canAccessPath('/finance', salesManagerMenus)).toBe(false)
    expect(canAccessPath('/finance/payments', salesManagerMenus)).toBe(false)
    expect(canAccessPath('/finance/payments/payment-1', salesManagerMenus)).toBe(false)
    expect(canAccessPath('/finance/reports/report-1', salesManagerMenus)).toBe(false)
  })

  it('blocks system routes for roles without system permission', () => {
    expect(canAccessPath('/organization/users', salesManagerMenus)).toBe(false)
    expect(canAccessPath('/organization/users/user-1', salesManagerMenus)).toBe(false)
    expect(canAccessPath('/system/mcp', salesManagerMenus)).toBe(false)
    expect(canAccessPath('/system/mcp/server-1', salesManagerMenus)).toBe(false)
  })

  it('keeps finance and system access working for finance and admin roles', () => {
    expect(canAccessPath('/finance', financeMenus)).toBe(true)
    expect(canAccessPath('/finance/payments/payment-1', financeMenus)).toBe(true)
    expect(canAccessPath('/finance/reports/report-1', financeMenus)).toBe(true)
    expect(canAccessPath('/reporting', financeMenus)).toBe(true)
    expect(canAccessPath('/system/mcp', financeMenus)).toBe(false)
    expect(canAccessPath('/system/mcp/server-1', systemAdminMenus)).toBe(true)
    expect(canAccessPath('/organization/users/user-1', systemAdminMenus)).toBe(true)
    expect(canAccessPath('/finance/reports/report-1', systemAdminMenus)).toBe(false)
  })

  it('only allows the modules granted to a partially-permitted role', () => {
    expect(canAccessPath('/masterdata/products/product-1', purchasePartialMenus)).toBe(true)
    expect(canAccessPath('/purchase/contracts/contract-1', purchasePartialMenus)).toBe(true)
    expect(canAccessPath('/masterdata/customers', purchasePartialMenus)).toBe(false)
    expect(canAccessPath('/finance', purchasePartialMenus)).toBe(false)
    expect(canAccessPath('/system/mcp', purchasePartialMenus)).toBe(false)
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
