import { request } from './core'

export interface ProductAccessory {
  id: string
  product_id: string
  accessory_name: string
  unit_consumption: string
  unit: string
  default_supplier_name: string | null
  purchase_split_rule: string
}

export interface Product {
  id: string
  code: string
  cn_name: string
  en_name: string
  specification: string | null
  model: string | null
  customs_code: string
  tax_rate: string
  rebate_rate: string
  package_info: string
  unit: string
  image_url: string | null
  status: string
  accessories: ProductAccessory[]
}

export interface ProductListSummary {
  with_image_count: number
  accessory_count: number
}

export interface ProductList {
  items: Product[]
  total: number
  summary: ProductListSummary
}

export interface ProductAccessoryPayload {
  accessory_name: string
  unit_consumption: string
  unit: string
  default_supplier_name?: string | null
  purchase_split_rule: string
}

export interface ProductCreatePayload {
  code: string
  cn_name: string
  en_name: string
  specification?: string | null
  model?: string | null
  customs_code: string
  tax_rate: string
  rebate_rate: string
  package_info: string
  unit: string
  image_url?: string | null
  status?: string
  accessories: ProductAccessoryPayload[]
}

export type ProductUpdatePayload = Omit<ProductCreatePayload, 'accessories'> & {
  status: string
}

export interface ProductExport {
  filename: string
  content_type: string
  content: string
}

export interface ProductImportError {
  row: number
  code: string | null
  message: string
}

export interface ProductImportResult {
  created: number
  updated: number
  failed: number
  errors: ProductImportError[]
}

export interface ProductCustomer {
  customer_id: string | null
  customer_name: string
  contract_count: number
  total_quantity: string
  total_amount: string
  last_contract_date: string | null
}

export interface ProductCustomerList {
  items: ProductCustomer[]
  total: number
}

export interface ProductTransaction {
  source_type: string
  source_code: string
  occurred_at: string
  counterparty_name: string | null
  quantity: string | null
  unit: string | null
  amount: string | null
  summary: string
}

export interface ProductTransactionList {
  items: ProductTransaction[]
  total: number
}

export function listProducts(
  filters: { q?: string; limit?: number; offset?: number } = {},
): Promise<ProductList> {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  if (filters.offset !== undefined) params.set('offset', String(filters.offset))
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<ProductList>(`/masterdata/products${suffix}`)
}

export function createProduct(payload: ProductCreatePayload): Promise<Product> {
  return request<Product>('/masterdata/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateProduct(productId: string, payload: ProductUpdatePayload): Promise<Product> {
  return request<Product>(`/masterdata/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deactivateProduct(productId: string): Promise<Product> {
  return request<Product>(`/masterdata/products/${productId}`, {
    method: 'DELETE',
  })
}

export function addProductAccessory(
  productId: string,
  payload: ProductAccessoryPayload,
): Promise<ProductAccessory> {
  return request<ProductAccessory>(`/masterdata/products/${productId}/accessories`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateProductAccessory(
  productId: string,
  accessoryId: string,
  payload: ProductAccessoryPayload,
): Promise<ProductAccessory> {
  return request<ProductAccessory>(`/masterdata/products/${productId}/accessories/${accessoryId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteProductAccessory(
  productId: string,
  accessoryId: string,
): Promise<ProductAccessory> {
  return request<ProductAccessory>(`/masterdata/products/${productId}/accessories/${accessoryId}`, {
    method: 'DELETE',
  })
}

export function exportProducts(): Promise<ProductExport> {
  return request<ProductExport>('/masterdata/products/export')
}

export function importProducts(
  filename: string,
  contentBase64: string,
): Promise<ProductImportResult> {
  return request<ProductImportResult>('/masterdata/products/import', {
    method: 'POST',
    body: JSON.stringify({ filename, content_base64: contentBase64 }),
  })
}

export function listProductCustomers(productId: string): Promise<ProductCustomerList> {
  return request<ProductCustomerList>(`/masterdata/products/${productId}/customers`)
}

export function listProductTransactions(productId: string): Promise<ProductTransactionList> {
  return request<ProductTransactionList>(`/masterdata/products/${productId}/transactions`)
}
