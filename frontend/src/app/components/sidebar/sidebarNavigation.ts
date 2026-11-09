import type { ComponentType } from 'react'
import {
  BarChart3,
  ClipboardCheck,
  LayoutDashboard,
  Package,
  Settings,
  ShieldCheck,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'

import { type MenuItem } from '@/api'
import { translate, type TranslationKey } from '@/locales'
import { getRuntimeSettings } from '@/app/pages/appHelpers'
import {
  dashboardPath,
  navChildrenForGroup,
  navPathsForGroup,
  type NavGroupId,
} from '@/app/routes'

const sidebarNavGroupDefinitions: Array<{
  id: NavGroupId
  labelKey: TranslationKey
  icon: LucideIcon
}> = [
  { id: 'masterdata', labelKey: 'nav.group.masterdata', icon: Package },
  { id: 'workflow', labelKey: 'nav.group.workflow', icon: ClipboardCheck },
  { id: 'taskCenter', labelKey: 'nav.group.taskCenter', icon: ShieldCheck },
  { id: 'warehouse', labelKey: 'nav.group.warehouse', icon: Warehouse },
  { id: 'finance', labelKey: 'nav.group.finance', icon: BarChart3 },
  { id: 'system', labelKey: 'nav.group.system', icon: Settings },
  { id: 'legacyPurchase', labelKey: 'nav.group.legacyPurchase', icon: ClipboardCheck },
]

const sidebarNavGroups = sidebarNavGroupDefinitions.map((group) => ({
  ...group,
  /** 分组内一级菜单路径（仅用于归属判断）。 */
  paths: navPathsForGroup(group.id),
  /** 分组内二级菜单路径（仅用于归属判断）。 */
  childPaths: navChildrenForGroup(group.id),
}))

export type SidebarChild = { path: string; label: string; active: boolean }
export type SidebarItem = MenuItem & { children?: SidebarChild[] }
export type SidebarGroup = {
  id: string
  label: string
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
  items: SidebarItem[]
}

export function getSidebarMenuGroups(menus: MenuItem[]): SidebarGroup[] {
  const language = getRuntimeSettings().language
  const groupedPaths = new Set<string>()
  const groups = sidebarNavGroups
    .map((group) => {
      const pathSet = new Set(group.paths)
      const childPathSet = new Set(group.childPaths)
      // 标题、顺序、权限均来自后端菜单，前端只决定它们落在哪个分组。
      const children: SidebarChild[] = menus
        .filter((menu) => childPathSet.has(menu.path))
        .map((menu) => ({ path: menu.path, label: menu.label, active: false }))
      const items: SidebarItem[] = menus
        .filter((menu) => pathSet.has(menu.path))
        .map((menu) =>
          children.length > 0 && menu.path === group.paths[0]
            ? { ...menu, children }
            : menu,
        )
      items.forEach((item) => groupedPaths.add(item.path))
      children.forEach((child) => groupedPaths.add(child.path))
      return { ...group, label: translate(language, group.labelKey), items }
    })
    .filter((group) => group.items.length > 0)
  const otherItems = menus.filter(
    (item) => item.path !== dashboardPath && !groupedPaths.has(item.path),
  )
  if (otherItems.length === 0) return groups
  return [
    ...groups,
    {
      id: 'other',
      label: translate(language, 'nav.group.other'),
      icon: LayoutDashboard,
      items: otherItems,
    },
  ]
}
