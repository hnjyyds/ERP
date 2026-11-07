import { describe, expect, it, vi } from 'vitest'

import type { MenuItem } from '../../../api'
import { getSidebarMenuGroups } from './sidebarNavigation'

vi.mock('../../pages/appHelpers', () => ({
  getRuntimeSettings: () => ({ language: 'zh-CN' }),
}))

vi.mock('../../../locales', () => ({
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

describe('getSidebarMenuGroups', () => {
  it('omits non-primary workflow entries from the sidebar', () => {
    const groups = getSidebarMenuGroups([
      menu('/masterdata/products'),
      menu('/sales/quotations'),
      menu('/purchase/inquiries'),
      menu('/warehouse/inbound-plans'),
    ])

    const paths = groups.flatMap((group) => group.items.map((item) => item.path))

    expect(paths).toEqual(['/masterdata/products'])
  })

  it('drops a group once all of its entries are hidden', () => {
    const groups = getSidebarMenuGroups([menu('/sales/quotations')])

    expect(groups).toEqual([])
  })

  it('keeps visible workflow entries and finance children intact', () => {
    const groups = getSidebarMenuGroups([
      menu('/sales/contracts'),
      menu('/finance'),
      menu('/finance/receipts'),
    ])

    const workflow = groups.find((group) => group.id === 'workflow')
    const finance = groups.find((group) => group.id === 'finance')

    expect(workflow?.items.map((item) => item.path)).toEqual(['/sales/contracts'])
    expect(finance?.items[0].children?.map((child) => child.path)).toContain('/finance/receipts')
  })
})
