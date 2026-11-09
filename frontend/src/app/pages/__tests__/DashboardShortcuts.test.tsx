import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { DashboardShortcut, MenuItem } from '@/api'
import { routeRegistry } from '@/app/routes'

vi.mock('@/app/appI18n', () => ({
  t: (key: string) => key,
}))

import {
  recommendedShortcutTargets,
  shortcutTargetOptions,
} from '@/app/pages/dashboard/shortcutCatalog'
import { DashboardShortcutsPanel } from '@/app/pages/dashboard/views/DashboardShortcutsPanel'

const menus: MenuItem[] = [
  {
    id: 'menu-dashboard',
    label: '工作台',
    path: '/',
    icon: 'layout-dashboard',
    required_permission: 'dashboard:view',
    sort_order: 0,
  },
  {
    id: 'menu-contracts',
    label: '出口合同',
    path: '/sales/contracts',
    icon: 'file-text',
    required_permission: 'sales:contract:view',
    sort_order: 10,
  },
  {
    id: 'menu-inbound-orders',
    label: '入库单',
    path: '/warehouse/inbound-orders',
    icon: 'package',
    required_permission: 'warehouse:inbound:view',
    sort_order: 20,
  },
]

const shortcut: DashboardShortcut = {
  id: 'shortcut-1',
  owner_user_id: 'user-1',
  label: '我的待办',
  target_path: '/workspace/todos',
  icon: 'clipboard-check',
  sort_order: 10,
}

function renderPanel(overrides: Partial<Parameters<typeof DashboardShortcutsPanel>[0]> = {}) {
  const props = {
    shortcuts: [shortcut],
    menus,
    canNavigatePath: () => true,
    onNavigate: vi.fn(),
    onCreate: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  return { ...render(<DashboardShortcutsPanel {...props} />), props }
}

describe('shortcutTargetOptions', () => {
  it('only lists paths that exist in routeDefinitions', () => {
    const registryPaths = new Set(routeRegistry.map((route) => route.path))
    for (const option of shortcutTargetOptions(menus)) {
      expect(registryPaths.has(option.value.split('?')[0])).toBe(true)
    }
  })

  it('adds verified query presets and skips inaccessible menus', () => {
    const options = shortcutTargetOptions(menus)
    expect(options.map((option) => option.value)).toContain('/sales/contracts')
    expect(options.map((option) => option.value)).toContain('/sales/contracts?status=submitted')
    expect(options.map((option) => option.value)).not.toContain('/')

    const limited = shortcutTargetOptions(menus.filter((menu) => menu.path !== '/sales/contracts'))
    expect(limited.map((option) => option.value)).not.toContain('/sales/contracts?status=submitted')
  })

  it('falls back to accessible list pages for recommendations', () => {
    expect(recommendedShortcutTargets(menus, 2).map((option) => option.value)).toEqual([
      '/sales/contracts',
      '/warehouse/inbound-orders',
    ])
  })
})

describe('DashboardShortcutsPanel', () => {
  it('renders configured shortcuts and navigates on click', async () => {
    const user = userEvent.setup()
    const { props } = renderPanel()

    await user.click(screen.getByRole('button', { name: '我的待办' }))
    expect(props.onNavigate).toHaveBeenCalledWith('/workspace/todos')
  })

  it('keeps a shortcut visible but disabled without navigation permission', async () => {
    const user = userEvent.setup()
    const { props } = renderPanel({ canNavigatePath: () => false })

    const button = screen.getByRole('button', { name: '我的待办' })
    expect(button).toBeDisabled()
    await user.click(button)
    expect(props.onNavigate).not.toHaveBeenCalled()
  })

  it('offers frontend fallback recommendations without writing data', async () => {
    const user = userEvent.setup()
    const { props } = renderPanel({ shortcuts: [] })

    expect(screen.getByText('dashboard.shortcutEmpty')).toBeInTheDocument()
    expect(props.onCreate).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: '出口合同' }))
    expect(props.onNavigate).toHaveBeenCalledWith('/sales/contracts')
  })

  it('creates a shortcut from the management modal using catalog targets', async () => {
    const user = userEvent.setup()
    const { props } = renderPanel()

    await user.click(screen.getByRole('button', { name: 'dashboard.manageShortcuts' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText('dashboard.shortcutName'), '合同待审批')
    await user.selectOptions(
      within(dialog).getByLabelText('dashboard.shortcutTarget'),
      '/sales/contracts?status=submitted',
    )
    await user.selectOptions(within(dialog).getByLabelText('dashboard.shortcutIcon'), 'file-text')
    await user.click(within(dialog).getByRole('button', { name: /dashboard.shortcutAdd/ }))

    expect(props.onCreate).toHaveBeenCalledWith({
      label: '合同待审批',
      target_path: '/sales/contracts?status=submitted',
      icon: 'file-text',
      sort_order: 100,
    })
  })

  it('deletes a shortcut from the management modal', async () => {
    const user = userEvent.setup()
    const { props } = renderPanel()

    await user.click(screen.getByRole('button', { name: 'dashboard.manageShortcuts' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'common.delete' }))

    expect(props.onDelete).toHaveBeenCalledWith('shortcut-1')
  })
})
