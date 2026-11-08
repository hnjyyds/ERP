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

const sidebarNavGroups = sidebarNavGroupDefinitions.map((group) => {
  const children = navChildrenForGroup(group.id).map((child) => ({
    path: child.path,
    labelKey: child.labelKey ?? ('nav.page.businessModule' as TranslationKey),
  }))
  return {
    ...group,
    paths: navPathsForGroup(group.id),
    ...(children.length > 0 ? { children } : {}),
  }
})

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
  const menuByPath = new Map(menus.map((item) => [item.path, item]))
  const groupedPaths = new Set<string>()
  const groups = sidebarNavGroups
    .map((group) => {
      const items: SidebarItem[] = group.paths
        .map((path) => menuByPath.get(path))
        .filter((item): item is MenuItem => Boolean(item))
        .map((menu) => {
          if (group.children && menu.path === group.paths[0]) {
            return {
              ...menu,
              children: group.children.map((child) => ({
                path: child.path,
                label: menuByPath.get(child.path)?.label ?? translate(language, child.labelKey),
                active: false,
              })),
            }
          }
          return menu
        })
      items.forEach((item) => groupedPaths.add(item.path))
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
