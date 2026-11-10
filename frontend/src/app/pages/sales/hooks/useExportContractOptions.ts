import { useCallback, useEffect, useRef, useState } from 'react'

import {
  listAssignableUsers,
  listCustomers,
  listProducts,
  type AssignableUser,
  type Customer,
  type Product,
} from '@/api'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'

/** 下拉单次加载条数；更多数据由关键字搜索分页获取。 */
const OPTION_LIMIT = 20

function mergeById<T extends { id: string }>(pinned: T[], latest: T[]): T[] {
  const merged = new Map(latest.map((item) => [item.id, item]))
  for (const item of pinned) merged.set(item.id, item)
  return Array.from(merged.values())
}

/** 出口合同表单需要的下拉数据：客户、商品，以及按需加载的可指派人员。 */
export function useExportContractOptions() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [pinnedCustomers, setPinnedCustomers] = useState<Customer[]>([])
  const [pinnedProducts, setPinnedProducts] = useState<Product[]>([])
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingAssignableUsers, setLoadingAssignableUsers] = useState(false)
  const [assignableUsersLoaded, setAssignableUsersLoaded] = useState(false)
  const assignableUsersRequestRef = useRef(false)
  const customerRequestRef = useRef(0)
  const productRequestRef = useRef(0)

  const loadCustomers = useCallback(async (query = '') => {
    const requestId = customerRequestRef.current + 1
    customerRequestRef.current = requestId
    setLoadingCustomers(true)
    try {
      const result = await listCustomers({
        q: query.trim() || undefined,
        status: 'active',
        limit: OPTION_LIMIT,
      })
      if (requestId === customerRequestRef.current) setCustomers(result.items)
    } catch (caught) {
      showError(caught, t('sales.contract.list.customerLoadFailed'))
    } finally {
      if (requestId === customerRequestRef.current) setLoadingCustomers(false)
    }
  }, [])

  const loadProducts = useCallback(async (query = '') => {
    const requestId = productRequestRef.current + 1
    productRequestRef.current = requestId
    setLoadingProducts(true)
    try {
      const result = await listProducts({
        q: query.trim() || undefined,
        limit: OPTION_LIMIT,
      })
      if (requestId === productRequestRef.current) setProducts(result.items)
    } catch (caught) {
      showError(caught, t('sales.contract.list.productLoadFailed'))
    } finally {
      if (requestId === productRequestRef.current) setLoadingProducts(false)
    }
  }, [])

  const pinCustomer = useCallback((customer: Customer) => {
    setPinnedCustomers((current) =>
      current.some((item) => item.id === customer.id) ? current : [...current, customer],
    )
  }, [])

  const pinProduct = useCallback((product: Product) => {
    setPinnedProducts((current) =>
      current.some((item) => item.id === product.id) ? current : [...current, product],
    )
  }, [])

  useEffect(() => {
    void loadCustomers('')
    void loadProducts('')
  }, [loadCustomers, loadProducts])

  const ensureAssignableUsers = useCallback(async () => {
    if (assignableUsersRequestRef.current) return
    assignableUsersRequestRef.current = true
    setLoadingAssignableUsers(true)
    try {
      const result = await listAssignableUsers('sales:contract:edit')
      setAssignableUsers(result.users)
      setAssignableUsersLoaded(true)
    } catch (caught) {
      showError(caught, t('sales.contract.list.salesUserLoadFailed'))
    } finally {
      setLoadingAssignableUsers(false)
    }
  }, [])

  return {
    customers: mergeById(pinnedCustomers, customers),
    products: mergeById(pinnedProducts, products),
    assignableUsers,
    loadingCustomers,
    loadingProducts,
    loadingAssignableUsers,
    assignableUsersLoaded,
    loadCustomers,
    loadProducts,
    pinCustomer,
    pinProduct,
    ensureAssignableUsers,
  }
}

export type ExportContractOptionsModel = ReturnType<typeof useExportContractOptions>
