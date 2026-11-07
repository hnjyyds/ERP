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

import { type MenuItem } from '../../../api'
import { translate, type TranslationKey } from '../../../locales'
import { getRuntimeSettings } from '../../pages/appHelpers'
import {
  customerPath,
  dashboardPath,
  documentPartyPath,
  exportContractPath,
  exportQuotationPath,
  financeFeesPath,
  financeMiscPath,
  financeOverviewPath,
  financePath,
  financePaymentsPath,
  financePortDataPath,
  financeReceiptsPath,
  financeReimbursementsPath,
  financeReportsPath,
  financeSettlementPath,
  financeTaxPath,
  followupPath,
  mcpSettingsPath,
  myQualityTasksPath,
  organizationUsersPath,
  partnerPath,
  productPath,
  purchaseContractPath,
  purchaseInquiryPath,
  purchaseInvoiceNoticePath,
  qualityInspectionPath,
  reportingPath,
  sampleDeliveryPath,
  sampleRecordPath,
  sampleRequestPath,
  shipmentPath,
  supplierPath,
  warehouseInboundOrderPath,
  warehouseInboundPlanPath,
  warehouseOutboundOrderPath,
  warehouseOutboundPlanPath,
} from '../../routes'

const sidebarNavGroups: Array<{
  id: string
  labelKey: TranslationKey
  icon: LucideIcon
  paths: string[]
  children?: { path: string; labelKey: TranslationKey }[]
}> = [
  {
    id: 'masterdata',
    labelKey: 'nav.group.masterdata',
    icon: Package,
    paths: [productPath, supplierPath, customerPath, partnerPath, documentPartyPath],
  },
  {
    id: 'workflow',
    labelKey: 'nav.group.workflow',
    icon: ClipboardCheck,
    paths: [exportContractPath, purchaseContractPath, exportQuotationPath, shipmentPath],
  },
  {
    id: 'taskCenter',
    labelKey: 'nav.group.taskCenter',
    icon: ShieldCheck,
    paths: [
      qualityInspectionPath,
      myQualityTasksPath,
      followupPath,
      sampleRecordPath,
      sampleRequestPath,
      sampleDeliveryPath,
    ],
  },
  {
    id: 'warehouse',
    labelKey: 'nav.group.warehouse',
    icon: Warehouse,
    paths: [
      warehouseInboundOrderPath,
      warehouseInboundPlanPath,
      warehouseOutboundPlanPath,
      warehouseOutboundOrderPath,
    ],
  },
  {
    id: 'finance',
    labelKey: 'nav.group.finance',
    icon: BarChart3,
    paths: [financePath, reportingPath],
    children: [
      { path: financeOverviewPath, labelKey: 'nav.item.financeOverview' },
      { path: financeReceiptsPath, labelKey: 'nav.item.financeReceipts' },
      { path: financePaymentsPath, labelKey: 'nav.item.financePayments' },
      { path: financeFeesPath, labelKey: 'nav.item.financeFees' },
      { path: financeTaxPath, labelKey: 'nav.item.financeTax' },
      { path: financeMiscPath, labelKey: 'nav.item.financeMisc' },
      { path: financeSettlementPath, labelKey: 'nav.item.financeSettlement' },
      { path: financeReimbursementsPath, labelKey: 'nav.item.financeReimbursements' },
      { path: financePortDataPath, labelKey: 'nav.item.financePortData' },
      { path: financeReportsPath, labelKey: 'nav.item.financeReports' },
    ],
  },
  {
    id: 'system',
    labelKey: 'nav.group.system',
    icon: Settings,
    paths: [organizationUsersPath, mcpSettingsPath],
  },
]

// 非主流程入口：只在侧栏隐藏，页面组件、路由与访问控制保持不变。
const hiddenNavPaths = new Set([
  organizationUsersPath,
  partnerPath,
  documentPartyPath,
  sampleRequestPath,
  sampleRecordPath,
  sampleDeliveryPath,
  exportQuotationPath,
  shipmentPath,
  purchaseInquiryPath,
  purchaseInvoiceNoticePath,
  warehouseInboundPlanPath,
  warehouseOutboundPlanPath,
  warehouseOutboundOrderPath,
])

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
  const visibleMenus = menus.filter((item) => !hiddenNavPaths.has(item.path))
  const menuByPath = new Map(visibleMenus.map((item) => [item.path, item]))
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
  const otherItems = visibleMenus.filter(
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
