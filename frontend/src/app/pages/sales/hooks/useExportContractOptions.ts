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

/** 出口合同表单需要的下拉数据：客户、商品，以及按需加载的可指派人员。 */
export function useExportContractOptions() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingAssignableUsers, setLoadingAssignableUsers] = useState(false)
  const [assignableUsersLoaded, setAssignableUsersLoaded] = useState(false)
  const assignableUsersRequestRef = useRef(false)

  async function loadCustomerOptions() {
    setLoadingCustomers(true)
    try {
      const result = await listCustomers()
      setCustomers(result.items)
    } catch (caught) {
      showError(caught, t('sales.contract.list.customerLoadFailed'))
    } finally {
      setLoadingCustomers(false)
    }
  }

  async function loadProductOptions() {
    setLoadingProducts(true)
    try {
      const result = await listProducts()
      setProducts(result.items)
    } catch (caught) {
      showError(caught, t('sales.contract.list.productLoadFailed'))
    } finally {
      setLoadingProducts(false)
    }
  }

  useEffect(() => {
    void loadCustomerOptions()
    void loadProductOptions()
  }, [])

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
    customers,
    products,
    assignableUsers,
    loadingCustomers,
    loadingProducts,
    loadingAssignableUsers,
    assignableUsersLoaded,
    ensureAssignableUsers,
  }
}

export type ExportContractOptionsModel = ReturnType<typeof useExportContractOptions>
