import {
  listCustomers,
  listExportContracts,
  listInboundOrders,
  listInventoryBalances,
  listOutboundOrders,
  listPartners,
  listProducts,
  listPurchaseContracts,
  listPurchaseInvoiceNotices,
  listQualityInspections,
  listSampleRecords,
  listShipments,
  listSuppliers,
  listAssignableUsers,
} from '@/api'
import type { RemoteSelectOption } from '@/shared/ui'

/** 供应商搜索选项：提交 UUID，编号与名称均可命中。 */
export async function fetchSupplierSelectOptions(query: string): Promise<RemoteSelectOption[]> {
  const result = await listSuppliers({ q: query.trim() || undefined, limit: 20 })
  return result.items.map((supplier) => ({
    value: supplier.id,
    label: supplier.cn_name || supplier.en_name || supplier.code,
    description: supplier.code,
  }))
}

/** 客户搜索选项：提交 UUID，编号与名称均可命中。 */
export async function fetchCustomerSelectOptions(query: string): Promise<RemoteSelectOption[]> {
  const result = await listCustomers({ q: query.trim() || undefined, limit: 20 })
  return result.items.map((customer) => ({
    value: customer.id,
    label: customer.cn_name || customer.en_name || customer.code,
    description: customer.code,
  }))
}

/** 商品搜索选项：提交 UUID，展示商品名称与编号，并携带规格/型号/单位派生值。 */
export async function fetchProductSelectOptions(query: string): Promise<RemoteSelectOption[]> {
  const result = await listProducts({
    q: query.trim() || undefined,
    status: 'active',
    limit: 20,
  })
  return result.items.map((product) => ({
    value: product.id,
    label: product.cn_name || product.en_name || product.code,
    description: product.code,
    unit: product.unit ?? '',
    specification: product.specification ?? '',
    model: product.model ?? '',
  }))
}

/** 开票通知选项：提交 UUID，展示通知编号与供应商名称。 */
export async function fetchPurchaseInvoiceNoticeOptions(
  query: string,
): Promise<RemoteSelectOption[]> {
  const result = await listPurchaseInvoiceNotices({ q: query.trim() || undefined, limit: 20 })
  return result.items.map((notice) => ({
    value: notice.id,
    label: notice.code,
    description: notice.supplier_name,
  }))
}

/** 采购合同选项：提交 UUID，展示合同编号与供应商名称。 */
export async function fetchPurchaseContractOptions(query: string): Promise<RemoteSelectOption[]> {
  const result = await listPurchaseContracts({ q: query.trim() || undefined, limit: 20 })
  return result.items.map((contract) => ({
    value: contract.id,
    label: contract.code,
    description: contract.supplier_name,
  }))
}

/** 出口合同选项：提交 UUID，展示合同号与客户名称。 */
export async function fetchExportContractSelectOptions(
  query: string,
): Promise<RemoteSelectOption[]> {
  const result = await listExportContracts({ q: query.trim() || undefined, limit: 20 })
  return result.items.map((contract) => ({
    value: contract.id,
    label: contract.code,
    description: contract.customer_name,
  }))
}

/** 合作伙伴选项：提交 UUID，展示名称与编号。 */
export async function fetchPartnerSelectOptions(query: string): Promise<RemoteSelectOption[]> {
  const result = await listPartners({ q: query.trim() || undefined, limit: 20 })
  return result.items.map((partner) => ({
    value: partner.id,
    label: partner.cn_name || partner.en_name || partner.code,
    description: partner.code,
  }))
}

/** 出货单选项：提交 UUID，展示出货单号与客户名称。 */
export async function fetchShipmentSelectOptions(query: string): Promise<RemoteSelectOption[]> {
  const result = await listShipments({ q: query.trim() || undefined, limit: 20 })
  return result.items.map((shipment) => ({
    value: shipment.id,
    label: shipment.code,
    description: shipment.customer_name,
  }))
}

/** 业务员选项：提交用户 UUID，展示姓名与部门。 */
export async function fetchUserSelectOptions(query: string): Promise<RemoteSelectOption[]> {
  const result = await listAssignableUsers()
  const keyword = query.trim().toLowerCase()
  return result.users
    .filter(
      (user) =>
        !keyword ||
        user.display_name.toLowerCase().includes(keyword) ||
        user.username.toLowerCase().includes(keyword),
    )
    .slice(0, 20)
    .map((user) => ({
      value: user.id,
      label: user.display_name || user.username,
      description: user.department_name || user.username,
    }))
}

/** 仓库选项：从库存余额与出入仓记录中汇总既有仓库。 */
export async function fetchWarehouseSelectOptions(query: string): Promise<RemoteSelectOption[]> {
  const result = await listInventoryBalances({ q: query.trim() || undefined, limit: 100 })
  const seen = new Set<string>()
  const options: RemoteSelectOption[] = []
  for (const balance of result.items) {
    if (!balance.warehouse_id || seen.has(balance.warehouse_id)) continue
    seen.add(balance.warehouse_id)
    options.push({
      value: balance.warehouse_id,
      label: balance.warehouse_name || balance.warehouse_id,
      description: balance.warehouse_name ? '' : undefined,
    })
  }
  return options
}

/** 库位选项：从库存余额中汇总既有库位，展示所属仓库。 */
export async function fetchLocationSelectOptions(query: string): Promise<RemoteSelectOption[]> {
  const result = await listInventoryBalances({ q: query.trim() || undefined, limit: 100 })
  const seen = new Set<string>()
  const options: RemoteSelectOption[] = []
  for (const balance of result.items) {
    if (!balance.location_id || seen.has(balance.location_id)) continue
    seen.add(balance.location_id)
    options.push({
      value: balance.location_id,
      label: balance.location_name || balance.location_id,
      description: balance.warehouse_name || undefined,
    })
  }
  return options
}

/** 跟单来源记录选项：按来源类型选择对应业务记录，提交业务记录 UUID。 */
export async function fetchFollowupSourceSelectOptions(
  sourceType: string,
  query: string,
): Promise<RemoteSelectOption[]> {
  const q = query.trim() || undefined
  if (sourceType === 'quality_inspection') {
    const result = await listQualityInspections({ q, limit: 20 })
    return result.items.map((inspection) => ({
      value: inspection.id,
      label: inspection.code,
      description: [inspection.supplier_name, inspection.result || inspection.status]
        .filter(Boolean)
        .join(' · '),
    }))
  }
  if (sourceType === 'inventory_inbound') {
    const result = await listInboundOrders({ q, limit: 20 })
    return result.items.map((order) => ({
      value: order.id,
      label: order.code,
      description: [order.supplier_name, order.purchase_contract_no].filter(Boolean).join(' · '),
    }))
  }
  if (sourceType === 'inventory_outbound') {
    const result = await listOutboundOrders({ q, limit: 20 })
    return result.items.map((order) => ({
      value: order.id,
      label: order.code,
      description: [order.customer_name, order.outbound_type].filter(Boolean).join(' · '),
    }))
  }
  if (sourceType === 'sample_followup_event') {
    const result = await listSampleRecords({ q, limit: 20 })
    const options: RemoteSelectOption[] = []
    for (const record of result.items) {
      for (const event of record.followup_events ?? []) {
        options.push({
          value: event.id,
          label: `${record.code} · ${event.node_label}`,
          description: [event.purchase_contract_no, event.actual_date].filter(Boolean).join(' · '),
        })
      }
    }
    return options.slice(0, 20)
  }
  return []
}
