import { useEffect, useState } from 'react'

import {
  listAssignableUsers,
  listProducts,
  listSuppliers,
  type AssignableUser,
  type Product,
  type Supplier,
} from '@/api'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'

/** 采购合同表单需要的下拉数据：商品、工厂、可指派人员。 */
export function usePurchaseContractOptions() {
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [loadingAssignableUsers, setLoadingAssignableUsers] = useState(false)

  async function loadProducts() {
    setLoadingProducts(true)
    try {
      const result = await listProducts()
      setProducts(result.items)
    } catch (caught) {
      showError(caught, t('purchase.contract.list.productLoadFailed'))
    } finally {
      setLoadingProducts(false)
    }
  }

  async function loadSuppliers() {
    setLoadingSuppliers(true)
    try {
      const result = await listSuppliers()
      setSuppliers(result.items)
    } catch (caught) {
      showError(caught, t('purchase.contract.list.supplierLoadFailed'))
    } finally {
      setLoadingSuppliers(false)
    }
  }

  async function loadAssignableUsers() {
    setLoadingAssignableUsers(true)
    try {
      const result = await listAssignableUsers('quality:inspection:edit')
      setAssignableUsers(result.users)
    } catch (caught) {
      showError(caught, t('purchase.contract.list.userLoadFailed'))
    } finally {
      setLoadingAssignableUsers(false)
    }
  }

  useEffect(() => {
    void loadProducts()
    void loadSuppliers()
    void loadAssignableUsers()
  }, [])

  return {
    products,
    suppliers,
    assignableUsers,
    loadingProducts,
    loadingSuppliers,
    loadingAssignableUsers,
  }
}
