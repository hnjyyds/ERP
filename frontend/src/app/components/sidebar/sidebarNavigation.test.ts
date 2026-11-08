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
    const groups = getSidebarMenuGroups([
      menu('/finance'),
      menu('/finance/receipts'),
      menu('/finance/payments'),
    ])

    const finance = groups.find((group) => group.id === 'finance')

    const childPaths = finance?.items[0].children?.map((child) => child.path)

    expect(childPaths).toContain('/finance/receipts')
    expect(childPaths).toContain('/finance/payments')
    expect(childPaths).toHaveLength(10)
  })
})
