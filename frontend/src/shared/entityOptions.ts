import { listCustomers, listSuppliers } from '@/api'
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
