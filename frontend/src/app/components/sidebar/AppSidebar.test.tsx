import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Package } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'

import { AppSidebar } from './AppSidebar'

vi.mock('../../App', () => ({
  t: (key: string) => key,
}))

const dashboardMenu = {
  id: 'dashboard',
  label: '工作台',
  path: '/',
  icon: 'dashboard',
  required_permission: 'dashboard:view',
  sort_order: 1,
}

const sidebarMenuGroups = [
  {
    id: 'masterdata',
    label: '基础资料',
    icon: Package,
    items: [
      {
        id: 'products',
        label: '商品资料',
        path: '/masterdata/products',
        icon: 'package',
        required_permission: 'masterdata:view',
        sort_order: 1,
      },
    ],
  },
]

const lockedMenuGroups = [
  {
    id: 'sample',
    label: '样品管理',
    icon: Package,
    items: [
      {
        id: 'sample-requests',
        label: '样品申请',
        path: '/sample/requests',
        icon: 'package',
        required_permission: 'sample:view',
        sort_order: 1,
      },
    ],
  },
  {
    id: 'legacyPurchase',
    label: '暂缓模块',
    icon: Package,
    items: [
      {
        id: 'purchase-inquiries',
        label: '采购询价',
        path: '/purchase/inquiries',
        icon: 'search',
        required_permission: 'purchase:view',
        sort_order: 1,
      },
    ],
  },
]

describe('AppSidebar', () => {
  it('keeps mobile navigation collapsed until the user opens it', async () => {
    const user = userEvent.setup()
    render(
      <AppSidebar
        activePath="/"
        dashboardMenu={dashboardMenu}
        sidebarMenuGroups={sidebarMenuGroups}
        onNavigate={vi.fn()}
      />,
    )

    const toggle = screen.getByRole('button', { name: '业务导航' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })

  it('closes the mobile navigation after selecting a destination', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(
      <AppSidebar
        activePath="/"
        dashboardMenu={dashboardMenu}
        sidebarMenuGroups={sidebarMenuGroups}
        onNavigate={onNavigate}
      />,
    )

    const toggle = screen.getByRole('button', { name: '业务导航' })
    await user.click(toggle)
    await user.click(screen.getByRole('link', { name: '工作台' }))

    expect(onNavigate).toHaveBeenCalledWith('/')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('explains why locked workflow entries are unavailable without navigating', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(
      <AppSidebar
        activePath="/"
        dashboardMenu={dashboardMenu}
        sidebarMenuGroups={lockedMenuGroups}
        onNavigate={onNavigate}
      />,
    )

    const outOfFlowItem = screen.getByRole('link', { name: '样品申请，该功能当前不纳入主业务流程' })
    const deferredItem = screen.getByRole('link', { name: '采购询价，该功能已列入暂缓模块，当前暂不开放' })

    expect(outOfFlowItem).toHaveAttribute('aria-disabled', 'true')
    expect(outOfFlowItem).toHaveAttribute('title', '该功能当前不纳入主业务流程')
    expect(outOfFlowItem).toHaveTextContent('非主流程')
    expect(deferredItem).toHaveTextContent('暂缓')

    await user.click(outOfFlowItem)
    expect(onNavigate).not.toHaveBeenCalled()
  })
})
