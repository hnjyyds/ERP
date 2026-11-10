import { useMemo, useState } from 'react'

import {
  listCustomers,
  listExportQuotations,
  listProducts,
  listSampleRecords,
  listSuppliers,
  type Customer,
  type ExportQuotation,
  type Product,
  type SampleRecord,
  type Supplier,
} from '@/api'
import { t } from '@/app/appI18n'
import { showError } from '@/shared/errors'
import type { RemoteSelectOption } from '@/shared/ui'

/** 下拉单次加载条数；更多数据由关键字搜索获取。 */
const OPTION_LIMIT = 20
const SEARCH_DEBOUNCE_MS = 250

type SearchFn<T> = (query: string) => Promise<T>

/** 合并短时间内的连续搜索，只保留最后一次查询结果。 */
function debounceSearch<T>(search: SearchFn<T>, wait = SEARCH_DEBOUNCE_MS): SearchFn<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: Array<{
    resolve: (value: T) => void
    reject: (reason: unknown) => void
  }> = []
  let latestQuery = ''

  return (query: string) =>
    new Promise<T>((resolve, reject) => {
      latestQuery = query
      pending.push({ resolve, reject })
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        const waiters = pending
        const requestedQuery = latestQuery
        pending = []
        timer = null
        void search(requestedQuery)
          .then((result) => waiters.forEach((waiter) => waiter.resolve(result)))
          .catch((caught) => waiters.forEach((waiter) => waiter.reject(caught)))
      }, wait)
    })
}

function customerLabel(customer: Customer): string {
  return customer.cn_name || customer.en_name || customer.code
}

function productLabel(product: Product): string {
  return [product.code, product.cn_name || product.en_name].filter(Boolean).join(' / ')
}

function supplierLabel(supplier: Supplier): string {
  return supplier.cn_name || supplier.en_name || supplier.code
}

async function withErrorFallback<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load()
  } catch (caught) {
    showError(caught, t('app.message.loadFailed'))
    throw caught
  }
}

/** 打样单/样品登记/寄样表单共用的服务端搜索选项。 */
export function useSampleFormOptions(customerId?: string) {
  const [caches] = useState(() => ({
    customers: new Map<string, Customer>(),
    products: new Map<string, Product>(),
    suppliers: new Map<string, Supplier>(),
    quotations: new Map<string, ExportQuotation>(),
    sampleRecords: new Map<string, SampleRecord>(),
  }))

  const fetchCustomers = useMemo(
    () =>
      debounceSearch(async (query): Promise<RemoteSelectOption[]> => {
        const result = await withErrorFallback(() =>
          listCustomers({
            q: query.trim() || undefined,
            status: 'active',
            limit: OPTION_LIMIT,
          }),
        )
        return result.items.map((customer) => {
          caches.customers.set(customer.id, customer)
          return {
            value: customer.id,
            label: customerLabel(customer),
            description: [customer.code, customer.country].filter(Boolean).join(' · '),
          }
        })
      }),
    [],
  )

  const fetchProducts = useMemo(
    () =>
      debounceSearch(async (query): Promise<RemoteSelectOption[]> => {
        const result = await withErrorFallback(() =>
          listProducts({
            q: query.trim() || undefined,
            status: 'active',
            limit: OPTION_LIMIT,
          }),
        )
        return result.items.map((product) => {
          caches.products.set(product.id, product)
          return {
            value: product.id,
            label: productLabel(product),
            description: [product.specification, product.model].filter(Boolean).join(' · '),
          }
        })
      }),
    [],
  )

  const fetchSuppliers = useMemo(
    () =>
      debounceSearch(async (query): Promise<RemoteSelectOption[]> => {
        const result = await withErrorFallback(() =>
          listSuppliers({
            q: query.trim() || undefined,
            status: 'active',
            limit: OPTION_LIMIT,
          }),
        )
        return result.items.map((supplier) => {
          caches.suppliers.set(supplier.id, supplier)
          return {
            value: supplier.id,
            label: supplierLabel(supplier),
            description: [supplier.code, supplier.country].filter(Boolean).join(' · '),
          }
        })
      }),
    [],
  )

  const fetchQuotations = useMemo(
    () =>
      debounceSearch(async (query): Promise<RemoteSelectOption[]> => {
        const result = await withErrorFallback(() =>
          listExportQuotations({
            q: query.trim() || undefined,
            limit: OPTION_LIMIT,
          }),
        )
        return result.items.map((quotation) => {
          caches.quotations.set(quotation.id, quotation)
          return {
            value: quotation.id,
            label: [quotation.code, quotation.customer_name].filter(Boolean).join(' / '),
          }
        })
      }),
    [],
  )

  const fetchSampleRecords = useMemo(
    () =>
      debounceSearch(async (query): Promise<RemoteSelectOption[]> => {
        const result = await withErrorFallback(() =>
          listSampleRecords({
            q: query.trim() || undefined,
            customer_id: customerId || undefined,
            limit: OPTION_LIMIT,
          }),
        )
        return result.items.map((record) => {
          caches.sampleRecords.set(record.id, record)
          return {
            value: record.id,
            label: [record.code, record.product_name].filter(Boolean).join(' / '),
            description: [
              record.sample_type,
              record.product_code,
              record.unit,
              record.stock_summary?.retained_quantity
                ? `${t('sample.record.field.retainedQuantity')} ${record.stock_summary.retained_quantity}`
                : null,
            ]
              .filter(Boolean)
              .join(' · '),
          }
        })
      }),
    [customerId],
  )

  return {
    fetchCustomers,
    fetchProducts,
    fetchSuppliers,
    fetchQuotations,
    fetchSampleRecords,
    getCustomer: (id: string) => caches.customers.get(id) ?? null,
    getProduct: (id: string) => caches.products.get(id) ?? null,
    getSupplier: (id: string) => caches.suppliers.get(id) ?? null,
    getQuotation: (id: string) => caches.quotations.get(id) ?? null,
    getSampleRecord: (id: string) => caches.sampleRecords.get(id) ?? null,
  }
}
