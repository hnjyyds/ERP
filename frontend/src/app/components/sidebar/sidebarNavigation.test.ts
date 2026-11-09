import { describe, expect, it, vi } from 'vitest'

import type { MenuItem } from '@/api'
import { getSidebarMenuGroups } from './sidebarNavigation'

vi.mock('@/app/pages/appHelpers', () => ({
  getRuntimeSettings: () => ({ language: 'zh-CN' }),
}))

vi.mock('@/locales', () => ({
  translate: (_language: string, key: string) => key,
}))

function menu(path: string): MenuItem {
  return {
    id: path,
    label: path,
    path,
    icon: 'package',
    required_permission: 'view',
    sort_order: 1,
  }
}

const restoredPaths = [
  '/organization/users',
  '/masterdata/partners',
  '/masterdata/document-parties',
  '/sample/requests',
  '/sample/records',
  '/sample/deliveries',
  '/sales/quotations',
  '/sales/shipments',
  '/purchase/inquiries',
  '/purchase/invoice-notices',
  '/warehouse/inbound-plans',
  '/warehouse/outbound-plans',
  '/warehouse/outbound-orders',
]

describe('getSidebarMenuGroups', () => {
  it('restores every implemented page to the sidebar', () => {
    const groups = getSidebarMenuGroups(restoredPaths.map(menu))

    const paths = groups.flatMap((group) => group.items.map((item) => item.path))

    expect(paths.sort()).toEqual([...restoredPaths].sort())
  })

  it('keeps the original group order and merges purchase documents into their own group', () => {
    const groups = getSidebarMenuGroups(restoredPaths.map(menu))

    expect(groups.map((group) => group.id)).toEqual([
      'masterdata',
      'workflow',
      'taskCenter',
      'warehouse',
      'system',
      'legacyPurchase',
    ])
  })

  it('keeps finance children intact', () => {
    const financeChildPaths = [
      '/finance/overview',
      '/finance/receipts',
      '/finance/payments',
      '/finance/fees',
      '/finance/tax',
      '/finance/misc',
      '/finance/settlement',
      '/finance/reimbursements',
      '/finance/port-data',
      '/finance/reports',
    ]
    const groups = getSidebarMenuGroups([
      menu('/finance'),
      ...financeChildPaths.map((path) => menu(path)),
    ])

    const finance = groups.find((group) => group.id === 'finance')

    const childPaths = finance?.items[0].children?.map((child) => child.path)

    expect(childPaths).toEqual(financeChildPaths)
    expect(groups.some((group) => group.id === 'other')).toBe(false)
  })

  it('renders finance children in backend menu order', () => {
    const groups = getSidebarMenuGroups([
      menu('/finance/payments'),
      menu('/finance'),
      menu('/finance/receipts'),
    ])

    const finance = groups.find((group) => group.id === 'finance')

    expect(finance?.items[0].children?.map((child) => child.path)).toEqual([
      '/finance/payments',
      '/finance/receipts',
    ])
  })

  it('omits child routes that the backend did not grant', () => {
    const groups = getSidebarMenuGroups([menu('/finance'), menu('/finance/receipts')])

    const finance = groups.find((group) => group.id === 'finance')

    expect(finance?.items[0].children?.map((child) => child.path)).toEqual([
      '/finance/receipts',
    ])
  })
})
