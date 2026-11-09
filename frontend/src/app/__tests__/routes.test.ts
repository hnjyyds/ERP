import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

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
} from '@/app/routes'
import { resolvePageRenderer } from '@/app/components/router/pageRegistry'

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
    expect(navChildrenForGroup('finance')).toContain(financeReportsPath)
  })
})

describe('page registry', () => {
  it('only renders exact paths for entries without detailRoot', () => {
    expect(resolvePageRenderer('/organization/users')).not.toBeNull()
    expect(resolvePageRenderer('/organization/users/user-1')).toBeNull()
    expect(resolvePageRenderer('/reporting/report-1')).toBeNull()
  })

  it('renders detail paths for detail roots and finance modules', () => {
    expect(resolvePageRenderer(productPath)).not.toBeNull()
    expect(resolvePageRenderer(`${productPath}/product-1`)).not.toBeNull()
    expect(resolvePageRenderer('/finance/payments/payment-1')).not.toBeNull()
  })

  it('returns null for unregistered paths', () => {
    expect(resolvePageRenderer('/not-registered')).toBeNull()
  })
})

describe('navigation contract', () => {
  const seedFile = [
    resolve(process.cwd(), '../backend/app/modules/system/auth/seed_navigation.py'),
    resolve(process.cwd(), 'backend/app/modules/system/auth/seed_navigation.py'),
  ].find((path) => existsSync(path))
  if (!seedFile) {
    throw new Error('找不到后端 seed_navigation.py，无法校验菜单路径契约')
  }
  const seedSource = readFileSync(seedFile, 'utf8')
  const menuSection = seedSource.slice(seedSource.indexOf('def system_menus'))
  const seededMenuPaths = [...menuSection.matchAll(/\bpath="([^"]+)"/g)].map(
    (match) => match[1],
  )

  it('registers every backend menu path in the frontend route registry', () => {
    const registeredPaths = new Set(routeRegistry.map((route) => route.path))
    const missing = seededMenuPaths.filter((path) => !registeredPaths.has(path))
    expect(
      missing,
      `后端菜单路径未在前端 routeDefinitions 注册：${missing.join('、')}`,
    ).toEqual([])
  })

  it('keeps backend menu paths unique', () => {
    const duplicated = seededMenuPaths.filter(
      (path, index) => seededMenuPaths.indexOf(path) !== index,
    )
    expect(duplicated, `后端菜单路径重复：${duplicated.join('、')}`).toEqual([])
  })

  it('keeps child menu metadata on the backend', () => {
    const missing = routeRegistry
      .filter((route) => route.navChild)
      .map((route) => route.path)
      .filter((path) => !seededMenuPaths.includes(path))
    expect(
      missing,
      `侧栏子菜单只在前端注册、后端菜单缺失：${missing.join('、')}`,
    ).toEqual([])
  })

  it('seeds all 36 business menus, including 10 finance modules', () => {
    const financePaths = seededMenuPaths.filter((path) => path.startsWith('/finance/'))
    // 36 个业务菜单 + 工作台根路径。
    expect(seededMenuPaths.filter((path) => path !== dashboardPath)).toHaveLength(36)
    expect(financePaths).toHaveLength(10)
    expect(financePaths).toContain(financeReportsPath)
  })

  it('keeps menu titles, english labels, icons and permissions on the backend', () => {
    const entries = [...menuSection.matchAll(/MenuItem\(\s*([\s\S]*?)\n {8}\)/g)].map(
      (match) => match[1],
    )
    expect(entries).toHaveLength(37)
    for (const entry of entries) {
      expect(entry).toMatch(/\blabel="[^"]+"/)
      expect(entry).toMatch(/\blabel_en="[^"]+"/)
      expect(entry).toMatch(/\bicon="[^"]+"/)
      expect(entry).toMatch(/\brequired_permission="[^"]+"/)
      expect(entry).toMatch(/\bsort_order=\d+/)
    }
  })
})
