import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Package } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'

import { AppSidebar } from './AppSidebar'

vi.mock('@/app/appI18n', () => ({
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

    const toggle = screen.getByRole('button', { name: 'nav.aria.businessNavigation' })
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

    const toggle = screen.getByRole('button', { name: 'nav.aria.businessNavigation' })
    await user.click(toggle)
    await user.click(screen.getByRole('link', { name: '工作台' }))

    expect(onNavigate).toHaveBeenCalledWith('/')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })
})
