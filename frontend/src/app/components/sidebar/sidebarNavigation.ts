import type { ComponentType } from 'react'
import {
  BarChart3,
  ClipboardCheck,
  LayoutDashboard,
  LockKeyhole,
  Package,
  Settings,
  ShieldCheck,
  Warehouse,
  type LucideIcon,
} from 'lucide-react'

import { type MenuItem } from '../../../api'
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
  label: string
  icon: LucideIcon
  paths: string[]
  children?: { path: string; label: string }[]
}> = [
  {
    id: 'masterdata',
    label: '基础资料',
    icon: Package,
    paths: [productPath, supplierPath, customerPath, partnerPath, documentPartyPath],
  },
  {
    id: 'workflow',
    label: '订单流程',
    icon: ClipboardCheck,
    paths: [exportContractPath, purchaseContractPath, exportQuotationPath, shipmentPath],
  },
  {
    id: 'taskCenter',
    label: 'QC / 跟单',
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
    label: '仓库',
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
    label: '财务经营',
    icon: BarChart3,
    paths: [financePath, reportingPath],
    children: [
      { path: financeOverviewPath, label: '经营总览' },
      { path: financeReceiptsPath, label: '收款管理' },
      { path: financePaymentsPath, label: '付款管理' },
      { path: financeFeesPath, label: '付费管理' },
      { path: financeTaxPath, label: '核销退税' },
      { path: financeMiscPath, label: '杂费管理' },
      { path: financeSettlementPath, label: '结算核算' },
      { path: financeReimbursementsPath, label: '报销管理' },
      { path: financePortDataPath, label: '口岸数据' },
      { path: financeReportsPath, label: '财务报表' },
    ],
  },
  {
    id: 'system',
    label: '系统设置',
    icon: Settings,
    paths: [organizationUsersPath, mcpSettingsPath],
  },
  {
    id: 'legacyPurchase',
    label: '暂缓模块',
    icon: LockKeyhole,
    paths: [purchaseInquiryPath, purchaseInvoiceNoticePath],
  },
]

export type SidebarChild = { path: string; label: string; active: boolean }
export type SidebarItem = MenuItem & { children?: SidebarChild[] }
export type SidebarGroup = {
  id: string
  label: string
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
  items: SidebarItem[]
}

export function getSidebarMenuGroups(menus: MenuItem[]): SidebarGroup[] {
  const menuByPath = new Map(menus.map((item) => [item.path, item]))
  const groupedPaths = new Set<string>()
  const groups = sidebarNavGroups
    .map((group) => {
      const items: SidebarItem[] = group.paths
        .map((path) => menuByPath.get(path))
        .filter((item): item is MenuItem => Boolean(item))
        .map((menu) => {
          const groupDef = sidebarNavGroups.find((g) => g.id === group.id)
          if (groupDef?.children && menu.path === groupDef.paths[0]) {
            return {
              ...menu,
              children: groupDef.children.map((child) => ({
                ...child,
                active: false,
              })),
            }
          }
          return menu
        })
      items.forEach((item) => groupedPaths.add(item.path))
      return { ...group, items }
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
      label: '其他',
      icon: LayoutDashboard,
      items: otherItems,
    },
  ]
}
