import {
  BarChart3,
  Bell,
  CalendarClock,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Package,
  Truck,
  Users,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { MenuItem } from '@/api'
import { exportContractPath, exportQuotationPath, routeRegistry, shipmentPath } from '@/app/routes'
import { t } from '@/app/appI18n'

export const shortcutIconKeys = [
  'layout-dashboard',
  'clipboard-check',
  'file-text',
  'calendar-clock',
  'package',
  'truck',
  'users',
  'wallet',
  'chart-column',
  'bell',
] as const

export type ShortcutIconKey = (typeof shortcutIconKeys)[number]

const iconRegistry: Record<string, LucideIcon> = {
  bell: Bell,
  'calendar-clock': CalendarClock,
  'chart-column': BarChart3,
  'clipboard-check': ClipboardCheck,
  'file-text': FileText,
  'layout-dashboard': LayoutDashboard,
  package: Package,
  truck: Truck,
  users: Users,
  wallet: Wallet,
}

export function shortcutIcon(key: string): LucideIcon {
  return iconRegistry[key] ?? LayoutDashboard
}

export function shortcutIconLabel(key: string): string {
  return t(`dashboard.shortcutIconName.${key}` as never)
}

export type ShortcutTargetOption = {
  value: string
  label: string
}

type ShortcutQueryPreset = {
  path: string
  query: string
  labelKey: string
}

/**
 * 只收录已确认消费对应 query 参数的列表页。
 * - /sales/contracts、/sales/quotations、/sales/shipments 均从 URL 读取 status，
 *   且 submitted 在各自状态下拉中存在。
 */
const shortcutQueryPresets: ShortcutQueryPreset[] = [
  {
    path: exportContractPath,
    query: 'status=submitted',
    labelKey: 'dashboard.shortcutPreset.contractSubmitted',
  },
  {
    path: exportQuotationPath,
    query: 'status=submitted',
    labelKey: 'dashboard.shortcutPreset.quotationSubmitted',
  },
  {
    path: shipmentPath,
    query: 'status=submitted',
    labelKey: 'dashboard.shortcutPreset.shipmentSubmitted',
  },
]

/** 由路由注册表与当前用户菜单生成目标清单，禁止手填 URL。 */
export function shortcutTargetOptions(menus: MenuItem[]): ShortcutTargetOption[] {
  const registryPaths = new Set(routeRegistry.map((route) => route.path))
  const labelByPath = new Map(menus.map((menu) => [menu.path, menu.label]))
  const options: ShortcutTargetOption[] = menus
    .filter((menu) => menu.path !== '/' && registryPaths.has(menu.path))
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((menu) => ({ value: menu.path, label: menu.label }))

  for (const preset of shortcutQueryPresets) {
    const baseLabel = labelByPath.get(preset.path)
    if (!baseLabel) continue
    options.push({
      value: `${preset.path}?${preset.query}`,
      label: `${baseLabel} · ${t(preset.labelKey as never)}`,
    })
  }

  return options
}

/** 新用户空状态的前端兜底推荐，不写库。 */
export function recommendedShortcutTargets(
  menus: MenuItem[],
  limit = 4,
): ShortcutTargetOption[] {
  return shortcutTargetOptions(menus).slice(0, limit)
}
