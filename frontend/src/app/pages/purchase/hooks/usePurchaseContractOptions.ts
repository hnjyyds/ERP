import { useCallback, useEffect, useRef, useState } from 'react'

import {
  listAssignableUsers,
  listExportContracts,
  listProducts,
  listSuppliers,
  type AssignableUser,
  type ExportContract,
  type Product,
  type Supplier,
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

/** 采购合同表单需要的下拉数据：商品、工厂、可指派人员。 */
export function usePurchaseContractOptions() {
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [pinnedProducts, setPinnedProducts] = useState<Product[]>([])
  const [pinnedSuppliers, setPinnedSuppliers] = useState<Supplier[]>([])
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([])
  const [exportContracts, setExportContracts] = useState<ExportContract[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [loadingAssignableUsers, setLoadingAssignableUsers] = useState(false)
  const [loadingExportContracts, setLoadingExportContracts] = useState(false)
  const productRequestRef = useRef(0)
  const supplierRequestRef = useRef(0)

  const loadProducts = useCallback(async (query = '') => {
    const requestId = productRequestRef.current + 1
    productRequestRef.current = requestId
    setLoadingProducts(true)
    try {
      const result = await listProducts({
        q: query.trim() || undefined,
        status: 'active',
        limit: OPTION_LIMIT,
      })
      if (requestId === productRequestRef.current) setProducts(result.items)
    } catch (caught) {
      showError(caught, t('purchase.contract.list.productLoadFailed'))
    } finally {
      if (requestId === productRequestRef.current) setLoadingProducts(false)
    }
  }, [])

  const loadSuppliers = useCallback(async (query = '') => {
    const requestId = supplierRequestRef.current + 1
    supplierRequestRef.current = requestId
    setLoadingSuppliers(true)
    try {
      const result = await listSuppliers({
        q: query.trim() || undefined,
        status: 'active',
        limit: OPTION_LIMIT,
      })
      if (requestId === supplierRequestRef.current) setSuppliers(result.items)
    } catch (caught) {
      showError(caught, t('purchase.contract.list.supplierLoadFailed'))
    } finally {
      if (requestId === supplierRequestRef.current) setLoadingSuppliers(false)
    }
  }, [])

  const pinProduct = useCallback((product: Product) => {
    setPinnedProducts((current) =>
      current.some((item) => item.id === product.id) ? current : [...current, product],
    )
  }, [])

  const pinSupplier = useCallback((supplier: Supplier) => {
    setPinnedSuppliers((current) =>
      current.some((item) => item.id === supplier.id) ? current : [...current, supplier],
    )
  }, [])

  const loadAssignableUsers = useCallback(async () => {
    setLoadingAssignableUsers(true)
    try {
      const result = await listAssignableUsers('quality:inspection:edit')
      setAssignableUsers(result.users)
    } catch (caught) {
      showError(caught, t('purchase.contract.list.userLoadFailed'))
    } finally {
      setLoadingAssignableUsers(false)
    }
  }, [])

  const loadExportContracts = useCallback(async () => {
    setLoadingExportContracts(true)
    try {
      const result = await listExportContracts({ approval_status: 'approved', limit: 50 })
      setExportContracts(result.items)
    } catch (caught) {
      showError(caught, t('purchase.contract.list.exportContractLoadFailed'))
    } finally {
      setLoadingExportContracts(false)
    }
  }, [])

  useEffect(() => {
    void loadProducts('')
    void loadSuppliers('')
    void loadAssignableUsers()
  }, [loadProducts, loadSuppliers, loadAssignableUsers])

  return {
    products: mergeById(pinnedProducts, products),
    suppliers: mergeById(pinnedSuppliers, suppliers),
    assignableUsers,
    exportContracts,
    loadingProducts,
    loadingSuppliers,
    loadingAssignableUsers,
    loadingExportContracts,
    loadProducts,
    loadSuppliers,
    loadExportContracts,
    pinProduct,
    pinSupplier,
  }
}
