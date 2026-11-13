// 商品资料：列表数据、URL 查询同步、分页与选中商品

import type { Dispatch, Key, SetStateAction } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  getProduct,
  listProductCustomers,
  listProducts,
  listProductTransactions,
  type Product,
  type ProductCustomer,
  type ProductListSummary,
  type ProductTransaction,
} from '@/api'
import { t } from '@/app/appI18n'
import { ApiError, showError } from '@/shared/errors'
import { useLatestRequest } from '@/shared/hooks/useLatestRequest'
import { useColumnView } from '@/shared/ui'
import { useTablePagination } from '@/shared/useTablePagination'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'
import { productPath } from '@/app/routes'
import { buildProductColumnOptions } from '../productHelpers'

type ProductsPageArgs = {
  detailId: string | null
  onNavigate: (path: string) => void
}

export type ProductsListModel = {
  products: Product[]
  setProducts: Dispatch<SetStateAction<Product[]>>
  selectedProduct: Product | null
  selectedProductId: string | null
  setSelectedProductId: (id: string | null) => void
  detailLoading: boolean
  search: string
  setSearch: (value: string) => void
  summary: ProductListSummary
  loading: boolean
  selectedRowKeys: Key[]
  setSelectedRowKeys: (keys: Key[]) => void
  columnViewControl: ReturnType<typeof useColumnView>['control']
  isColumnVisible: (key: string) => boolean
  page: number
  pageSize: number
  total: number
  setTotal: (value: number) => void
  setPage: (value: number) => void
  changePage: (page: number, pageSize: number) => { page: number; pageSize: number }
  pagination: ReturnType<typeof useTablePagination>['pagination']
  relatedCustomers: ProductCustomer[]
  transactions: ProductTransaction[]
  loadProducts: (
    preferredId?: string,
    pageOverride?: number,
    pageSizeOverride?: number,
    queryOverride?: string,
  ) => Promise<void>
  submitSearch: (query?: string) => void
  goToPage: (nextPage: number, nextPageSize: number) => void
  resetToFirstPage: (preferredId?: string) => Promise<void>
}

export function useProductsPage({ detailId, onNavigate }: ProductsPageArgs): ProductsListModel {
  const urlQuery = useUrlQuery()
  const appliedUrlSearchRef = useRef(urlQuery.search)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductIdState] = useState<string | null>(null)
  const [detailProduct, setDetailProduct] = useState<Product | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const latestRequest = useLatestRequest()
  const [search, setSearch] = useState(() => urlQuery.params.get('q') ?? '')
  const [summary, setSummary] = useState<ProductListSummary>({
    with_image_count: 0,
    accessory_count: 0,
  })
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [relatedCustomers, setRelatedCustomers] = useState<ProductCustomer[]>([])
  const [transactions, setTransactions] = useState<ProductTransaction[]>([])
  const { page, pageSize, total, setTotal, setPage, changePage, pagination } = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params),
  )

  const { isVisible: isColumnVisible, control: columnViewControl } = useColumnView(
    'masterdata-products',
    buildProductColumnOptions(),
  )

  const selectedProduct = useMemo(() => {
    if (detailId) {
      return products.find((item) => item.id === detailId) ?? detailProduct ?? null
    }
    return products.find((item) => item.id === selectedProductId) ?? products[0] ?? null
  }, [detailId, detailProduct, products, selectedProductId])

  useEffect(() => {
    void loadProducts()
  }, [])

  // 浏览器前进/后退或外部导航只改变查询串时，App 的 activePath 不变，需要页面自己重新读取。
  useEffect(() => {
    if (appliedUrlSearchRef.current === urlQuery.search) return
    appliedUrlSearchRef.current = urlQuery.search
    const nextSearch = urlQuery.params.get('q') ?? ''
    const nextPage = parsePageParam(urlQuery.params)
    setSearch(nextSearch)
    setPage(nextPage)
    void loadProducts(undefined, nextPage, pageSize, nextSearch)
  }, [urlQuery.search])

  useEffect(() => {
    if (!selectedProduct) {
      setRelatedCustomers([])
      setTransactions([])
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const [customerResult, transactionResult] = await Promise.all([
          listProductCustomers(selectedProduct.id),
          listProductTransactions(selectedProduct.id),
        ])
        if (!cancelled) {
          setRelatedCustomers(customerResult.items)
          setTransactions(transactionResult.items)
        }
      } catch {
        if (!cancelled) {
          setRelatedCustomers([])
          setTransactions([])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedProduct?.id])

  // 详情按 ID 独立请求：列表只作为首屏优化，不再用“当前页是否包含”判断记录是否存在。
  useEffect(() => {
    if (!detailId) {
      setDetailProduct(null)
      setDetailLoading(false)
      return
    }
    if (products.some((item) => item.id === detailId)) {
      setDetailProduct(null)
      setDetailLoading(false)
      return
    }
    let cancelled = false
    setDetailLoading(true)
    void (async () => {
      try {
        const product = await getProduct(detailId)
        if (!cancelled) setDetailProduct(product)
      } catch (caught) {
        if (cancelled) return
        if (caught instanceof ApiError && caught.status === 404) {
          onNavigate(productPath)
        } else {
          showError(caught, t('masterdata.product.loadFailed'))
        }
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [detailId, onNavigate, products])

  async function loadProducts(
    preferredId?: string,
    pageOverride?: number,
    pageSizeOverride?: number,
    queryOverride?: string,
  ) {
    const resolvedPage = pageOverride ?? page
    const resolvedPageSize = pageSizeOverride ?? pageSize
    const resolvedQuery = queryOverride ?? search
    setLoading(true)
    const requestId = latestRequest.begin()
    try {
      const result = await listProducts({
        q: resolvedQuery.trim() || undefined,
        limit: resolvedPageSize,
        offset: (resolvedPage - 1) * resolvedPageSize,
      })
      if (!latestRequest.isLatest(requestId)) return
      setTotal(result.total)
      setSummary(result.summary)
      if (result.items.length === 0 && resolvedPage > 1) {
        const prevPage = resolvedPage - 1
        setPage(prevPage)
        appliedUrlSearchRef.current = urlQuery.update({
          page: prevPage === 1 ? null : prevPage,
        })
        await loadProducts(preferredId, prevPage, resolvedPageSize, resolvedQuery)
        return
      }
      setProducts(result.items)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedProductId) ? selectedProductId : null) ??
        result.items[0]?.id ??
        null
      setSelectedProductIdState(nextSelectedId)
    } catch (caught) {
      if (!latestRequest.isLatest(requestId)) return
      showError(caught, t('masterdata.product.loadFailed'))
    } finally {
      if (latestRequest.isLatest(requestId)) setLoading(false)
    }
  }

  function setSelectedProductId(id: string | null) {
    setSelectedProductIdState(id)
  }

  function submitSearch(query: string = search) {
    setSearch(query)
    setPage(1)
    appliedUrlSearchRef.current = urlQuery.update({ q: query, page: null })
    void loadProducts(undefined, 1)
  }

  function goToPage(nextPage: number, nextPageSize: number) {
    const next = changePage(nextPage, nextPageSize)
    appliedUrlSearchRef.current = urlQuery.update({
      page: next.page === 1 ? null : next.page,
    })
    void loadProducts(undefined, next.page, next.pageSize)
  }

  async function resetToFirstPage(preferredId?: string) {
    setPage(1)
    appliedUrlSearchRef.current = urlQuery.update({ page: null })
    await loadProducts(preferredId, 1)
  }

  return {
    products,
    setProducts,
    selectedProduct,
    selectedProductId,
    setSelectedProductId,
    detailLoading,
    search,
    setSearch,
    summary,
    loading,
    selectedRowKeys,
    setSelectedRowKeys,
    columnViewControl,
    isColumnVisible,
    page,
    pageSize,
    total,
    setTotal,
    setPage,
    changePage,
    pagination,
    relatedCustomers,
    transactions,
    loadProducts,
    submitSearch,
    goToPage,
    resetToFirstPage,
  }
}
