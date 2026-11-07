import { Alert, Button, Image, Input, Modal, Select, Table, Tag, Tooltip, Upload } from 'antd'
import {
  ArrowLeft,
  Download,
  FilePenLine,
  ImagePlus,
  LayoutDashboard,
  Plus,
  Search,
  Trash2,
  Upload as UploadIcon,
  Users,
} from 'lucide-react'
import type { ChangeEvent, FormEvent, MouseEvent } from 'react'
import React from 'react'
import { useEffect, useMemo, useState } from 'react'

import {
  addProductAccessory,
  createProduct,
  deactivateProduct,
  deleteProductAccessory,
  exportProducts as _exportProducts,
  importProducts,
  listProductCustomers,
  listProducts,
  listProductTransactions,
  updateProduct,
  updateProductAccessory,
  uploadImage,
  type Product,
  type ProductAccessoryPayload,
  type ProductCreatePayload,
  type ProductCustomer,
  type ProductExport,
  type ProductImportResult,
  type ProductTransaction,
  type ProductUpdatePayload,
} from '../../../api'
import { showError, showSuccess, showWarningDialog } from '../../../shared/errors'
import { downloadCsv } from '../../../shared/print'
import { Metric, PanelTitle, useColumnView, type ColumnOption } from '../../../shared/ui'
import { useTablePagination } from '../../../shared/useTablePagination'
import { t, type TranslationKey } from '../../appI18n'
import { productDetailPath, productPath } from '../../routes'

function buildProductColumnOptions(): ColumnOption[] {
  return [
    { key: 'code', title: t('masterdata.product.field.code'), required: true },
    { key: 'cn_name', title: t('masterdata.product.field.cnName') },
    { key: 'en_name', title: t('masterdata.product.field.enName') },
    { key: 'customs_code', title: t('masterdata.product.field.customsCode') },
    { key: 'unit', title: t('masterdata.product.field.unit') },
    { key: 'status', title: t('masterdata.product.field.status') },
    { key: 'accessories', title: t('masterdata.product.field.accessories') },
  ]
}

function productStatusOptions() {
  return [
    { value: 'active', label: t('status.active') },
    { value: 'inactive', label: t('status.inactive') },
  ]
}

const maxProductImageBytes = 2_000_000

function accessoryRuleOptions() {
  return [
    { value: 'by_supplier', label: t('masterdata.product.accessoryRule.bySupplier') },
    { value: 'by_accessory', label: t('masterdata.product.accessoryRule.byAccessory') },
  ]
}

type ProductFormState = {
  code: string
  cn_name: string
  en_name: string
  specification: string
  model: string
  customs_code: string
  tax_rate: string
  rebate_rate: string
  package_info: string
  unit: string
  image_url: string
  status: string
  accessory_name: string
  accessory_unit_consumption: string
  accessory_unit: string
  accessory_supplier: string
  accessory_rule: string
}

type ProductAccessoryFormState = {
  accessory_name: string
  unit_consumption: string
  unit: string
  supplier: string
  rule: string
}

type ProductsPageProps = {
  detailId: string | null
  onNavigate: (path: string) => void
}

export function ProductsPage({ detailId, onNavigate }: ProductsPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [exportResult, setExportResult] = useState<ProductExport | null>(null)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [form, setForm] = useState<ProductFormState>(() => initialProductForm())
  const [accessoryForm, setAccessoryForm] = useState<ProductAccessoryFormState>(() =>
    initialProductAccessoryForm(),
  )
  const [productModalMode, setProductModalMode] = useState<'create' | 'edit' | null>(null)
  const [accessoryModalMode, setAccessoryModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingAccessoryId, setEditingAccessoryId] = useState<string | null>(null)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importResult, setImportResult] = useState<ProductImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [relatedCustomers, setRelatedCustomers] = useState<ProductCustomer[]>([])
  const [transactions, setTransactions] = useState<ProductTransaction[]>([])
  const { page, pageSize, setTotal, setPage, changePage, pagination } = useTablePagination()

  const { isVisible: isColumnVisible, control: columnViewControl } = useColumnView(
    'masterdata-products',
    buildProductColumnOptions(),
  )

  const selectedProduct = useMemo(
    () => {
      if (detailId) {
        return products.find((item) => item.id === detailId) ?? null
      }
      return products.find((item) => item.id === selectedProductId) ?? products[0] ?? null
    },
    [detailId, products, selectedProductId],
  )

  useEffect(() => {
    void loadProducts()
  }, [])

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

  useEffect(() => {
    if (detailId && products.length > 0 && !products.some((item) => item.id === detailId)) {
      onNavigate(productPath)
    }
  }, [detailId, onNavigate, products])

  async function loadProducts(preferredId?: string, pageOverride?: number, pageSizeOverride?: number) {
    const resolvedPage = pageOverride ?? page
    const resolvedPageSize = pageSizeOverride ?? pageSize
    setLoading(true)
    try {
      const result = await listProducts({
        q: search.trim() || undefined,
        limit: resolvedPageSize,
        offset: (resolvedPage - 1) * resolvedPageSize,
      })
      setTotal(result.total)
      if (result.items.length === 0 && resolvedPage > 1) {
        const prevPage = resolvedPage - 1
        setPage(prevPage)
        await loadProducts(preferredId, prevPage, resolvedPageSize)
        return
      }
      setProducts(result.items)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedProductId) ? selectedProductId : null) ??
        result.items[0]?.id ??
        null
      setSelectedProductId(nextSelectedId)
    } catch (caught) {
      showError(caught, t('masterdata.product.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  function openCreateProduct() {
    setForm(initialProductForm())
    setProductModalMode('create')
    setExportResult(null)
  }

  function openEditProduct() {
    if (!selectedProduct) return
    setForm(productToForm(selectedProduct))
    setProductModalMode('edit')
    setExportResult(null)
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const missing = validateProductForm(form)
    if (missing) {
      showWarningDialog(missing)
      return
    }
    setSubmitting(true)
    setMessage('')
    setExportResult(null)
    try {
      if (productModalMode === 'edit' && selectedProduct) {
        const updated = await updateProduct(selectedProduct.id, productUpdatePayload(form))
        setMessage(t('masterdata.product.saved', { code: updated.code }))
        setProductModalMode(null)
        await loadProducts(updated.id)
        return
      }
      const created = await createProduct(productPayload(form))
      setMessage(t('masterdata.product.created', { code: created.code }))
      setForm(initialProductForm())
      setProductModalMode(null)
      setPage(1)
      await loadProducts(created.id, 1)
    } catch (caught) {
      showError(caught, t('masterdata.product.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function handleImageFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showWarningDialog(t('masterdata.product.imageTypeInvalid'))
      return
    }
    if (file.size > maxProductImageBytes) {
      showWarningDialog(t('masterdata.product.imageTooLarge'))
      return
    }
    void (async () => {
      try {
        const dataUrl = await readFileAsDataUrl(file)
        // 上传到对象存储，表单保存返回的可访问 URL（而非 base64）。
        const uploaded = await uploadImage(file.name, dataUrl)
        setForm((current) => ({ ...current, image_url: uploaded.url }))
      } catch (caught) {
        showError(caught, t('masterdata.product.imageUploadFailed'))
      }
    })()
  }

  async function submitImport(file: File) {
    setImporting(true)
    setMessage('')
    try {
      const dataUrl = await readFileAsDataUrl(file)
      const result = await importProducts(file.name, dataUrl)
      setImportResult(result)
      setMessage(
        t('masterdata.product.import.result', {
          created: result.created,
          updated: result.updated,
          failed: result.failed,
        }),
      )
      await loadProducts()
    } catch (caught) {
      showError(caught, t('masterdata.product.import.failed'))
    } finally {
      setImporting(false)
    }
  }

  function openCreateAccessory() {
    setAccessoryForm(initialProductAccessoryForm())
    setEditingAccessoryId(null)
    setAccessoryModalMode('create')
  }

  function openEditAccessory(accessory: Product['accessories'][number]) {
    setAccessoryForm(productAccessoryToForm(accessory))
    setEditingAccessoryId(accessory.id)
    setAccessoryModalMode('edit')
  }

  async function submitAccessory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedProduct) return
    setSubmitting(true)
    setMessage('')
    try {
      const accessory =
        accessoryModalMode === 'edit' && editingAccessoryId
          ? await updateProductAccessory(
              selectedProduct.id,
              editingAccessoryId,
              accessoryPayload(accessoryForm),
            )
          : await addProductAccessory(selectedProduct.id, accessoryPayload(accessoryForm))
      setProducts((current) =>
        current.map((product) =>
          product.id === selectedProduct.id
            ? {
                ...product,
                accessories:
                  accessoryModalMode === 'edit'
                    ? product.accessories.map((item) =>
                        item.id === accessory.id ? accessory : item,
                      )
                    : [...product.accessories, accessory],
              }
            : product,
        ),
      )
      setMessage(
        accessoryModalMode === 'edit'
          ? t('masterdata.product.accessory.saved', { name: accessory.accessory_name })
          : t('masterdata.product.accessory.added', { name: accessory.accessory_name }),
      )
      setAccessoryForm(initialProductAccessoryForm())
      setAccessoryModalMode(null)
      setEditingAccessoryId(null)
    } catch (caught) {
      showError(caught, t('masterdata.product.accessory.saveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function confirmDeactivateProduct() {
    if (!selectedProduct) return
    Modal.confirm({
      title: t('masterdata.product.deactivateTitle', { code: selectedProduct.code }),
      content: t('masterdata.product.deactivateContent'),
      okText: t('masterdata.product.deactivate'),
      cancelText: t('common.cancel'),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const deactivated = await deactivateProduct(selectedProduct.id)
          setMessage(t('masterdata.product.deactivated', { code: deactivated.code }))
          await loadProducts()
        } catch (caught) {
          showError(caught, t('masterdata.product.deactivateFailed'))
        }
      },
    })
  }

  function confirmDeleteAccessory(accessory: Product['accessories'][number]) {
    if (!selectedProduct) return
    Modal.confirm({
      title: t('masterdata.product.accessory.deleteTitle', { name: accessory.accessory_name }),
      content: t('masterdata.product.accessory.deleteContent'),
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteProductAccessory(selectedProduct.id, accessory.id)
          setProducts((current) =>
            current.map((product) =>
              product.id === selectedProduct.id
                ? {
                    ...product,
                    accessories: product.accessories.filter((item) => item.id !== accessory.id),
                  }
                : product,
            ),
          )
          setMessage(t('masterdata.product.accessory.deleted', { name: accessory.accessory_name }))
        } catch (caught) {
          showError(caught, t('masterdata.product.accessory.deleteFailed'))
        }
      },
    })
  }

  function exportSelectedCsv() {
    const selectedIds = new Set(selectedRowKeys.map(String))
    const toExport = selectedIds.size > 0
      ? products.filter((p) => selectedIds.has(p.id))
      : products
    if (toExport.length === 0) {
      showWarningDialog(t('masterdata.product.exportEmpty'))
      return
    }
    const headers = [
      t('masterdata.product.field.code'),
      t('masterdata.product.field.cnName'),
      t('masterdata.product.field.enName'),
      t('masterdata.product.field.specification'),
      t('masterdata.product.field.model'),
      t('masterdata.product.field.customsCode'),
      t('masterdata.product.field.rebateRate'),
      t('masterdata.product.field.packageInfoExport'),
      t('masterdata.product.field.unit'),
      t('masterdata.product.field.status'),
    ]
    const csvRows = toExport.map((p) => [
      p.code, p.cn_name, p.en_name, p.specification ?? '', p.model ?? '',
      p.customs_code, p.rebate_rate, p.package_info, p.unit,
      p.status === 'active'
        ? t('status.active')
        : t('status.inactive'),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    const csv = [headers.join(','), ...csvRows].join('\n')
    downloadCsv(t('masterdata.product.exportFileName'), csv)
    showSuccess(t('masterdata.product.exportSuccess', { count: toExport.length }))
  }

  function openProductDetail(product: Product) {
    setSelectedProductId(product.id)
    onNavigate(productDetailPath(product.id))
  }

  function stopAndOpenProductDetail(event: MouseEvent<HTMLElement>, product: Product) {
    event.stopPropagation()
    openProductDetail(product)
  }

  return (
    <section className="masterdata-page product-page">
      <div className="summary-strip" aria-label={t('masterdata.product.overviewAria')}>
        <Metric label={t('masterdata.product.metric.products')} value={products.length} />
        <Metric
          label={t('masterdata.product.metric.accessories')}
          value={products.reduce((sum, item) => sum + item.accessories.length, 0)}
        />
        <Metric
          label={t('masterdata.product.metric.withImage')}
          value={products.filter((item) => Boolean(item.image_url)).length}
        />
        <Metric label={t('masterdata.product.metric.exported')} value={exportResult ? 1 : 0} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}

      <section
        className={
          detailId
            ? 'business-grid product-business-grid product-detail-page-grid'
            : 'business-grid product-business-grid'
        }
      >
        {!detailId ? (
          <section className="workspace-panel list-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<Search size={18} />} title={t('masterdata.product.listTitle')} />
              <form
                className="inline-filters product-list-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  setPage(1)
                  void loadProducts(undefined, 1)
                }}
              >
                <label className="inline-filter-search">
                  {t('masterdata.product.searchLabel')}
                  <Input
                    value={search}
                    placeholder={t('masterdata.product.searchPlaceholder')}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <div className="product-filter-actions">
                  <Tooltip title={t('masterdata.product.searchAction')}>
                    <Button
                      aria-label={t('masterdata.product.searchAction')}
                      className="toolbar-icon-button"
                      htmlType="submit"
                      icon={<Search size={16} />}
                    />
                  </Tooltip>
                  <Button type="primary" icon={<Plus size={16} />} onClick={openCreateProduct}>
                    {t('masterdata.product.create')}
                  </Button>
                  <Tooltip title={t('masterdata.product.importAction')}>
                    <Button
                      aria-label={t('masterdata.product.importAction')}
                      className="toolbar-icon-button"
                      icon={<UploadIcon size={16} />}
                      onClick={() => {
                        setImportResult(null)
                        setImportModalOpen(true)
                      }}
                    />
                  </Tooltip>
                  <Tooltip
                    title={
                      selectedRowKeys.length > 0
                        ? t('masterdata.product.exportSelected', { count: selectedRowKeys.length })
                        : t('masterdata.product.exportAll')
                    }
                  >
                    <Button
                      aria-label={
                        selectedRowKeys.length > 0
                          ? t('masterdata.product.exportSelected', { count: selectedRowKeys.length })
                          : t('masterdata.product.exportAll')
                      }
                      className="toolbar-icon-button"
                      icon={<Download size={16} />}
                      onClick={exportSelectedCsv}
                    />
                  </Tooltip>
                  {columnViewControl}
                </div>
              </form>
            </div>

            <Table<Product>
              rowSelection={{
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
              }}
              columns={[
                {
                  title: t('masterdata.product.field.code'),
                  dataIndex: 'code',
                  render: (value: string, record: Product) => (
                    <button
                      className="row-button"
                      type="button"
                      onClick={(event) => stopAndOpenProductDetail(event, record)}
                    >
                      {value}
                    </button>
                  ),
                },
                { title: t('masterdata.product.field.cnName'), dataIndex: 'cn_name' },
                { title: t('masterdata.product.field.enName'), dataIndex: 'en_name' },
                { title: t('masterdata.product.field.customsCode'), dataIndex: 'customs_code' },
                { title: t('masterdata.product.field.unit'), dataIndex: 'unit', width: 80 },
                {
                  title: t('masterdata.product.field.status'),
                  dataIndex: 'status',
                  width: 90,
                  render: (value: string) => (
                    <Tag color={value === 'active' ? 'success' : 'default'}>
                      {value === 'active'
                        ? t('status.active')
                        : t('status.inactive')}
                    </Tag>
                  ),
                },
                {
                  title: t('masterdata.product.field.accessories'),
                  dataIndex: 'accessories',
                  width: 80,
                  render: (_value: Product['accessories'], record: Product) => record.accessories.length,
                },
                {
                  title: t('masterdata.product.field.entry'),
                  dataIndex: 'detail',
                  width: 110,
                  render: (_value: unknown, record: Product) => (
                    <Button size="small" onClick={(event) => stopAndOpenProductDetail(event, record)}>
                      {t('masterdata.product.viewDetail')}
                    </Button>
                  ),
                },
              ].filter((column) => column.dataIndex === 'detail' || isColumnVisible(column.dataIndex as string))}
              dataSource={products}
              loading={loading}
              pagination={{
                ...pagination,
                onChange: (nextPage, nextPageSize) => {
                  const next = changePage(nextPage, nextPageSize)
                  void loadProducts(undefined, next.page, next.pageSize)
                },
              }}
              rowClassName={(record) => (record.id === selectedProduct?.id ? 'selected-row' : '')}
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => setSelectedProductId(record.id),
              })}
            />
          </section>
        ) : null}

        {detailId ? (
          <section className="workspace-panel detail-panel product-standalone-detail">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<LayoutDashboard size={18} />}
                title={t('masterdata.product.detailTitle')}
              />
              {selectedProduct ? (
                <div className="section-actions">
                  <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(productPath)}>
                    {t('masterdata.product.backToList')}
                  </Button>
                  <Button icon={<FilePenLine size={16} />} onClick={openEditProduct}>
                    {t('masterdata.product.edit')}
                  </Button>
                  <Button danger icon={<Trash2 size={16} />} onClick={confirmDeactivateProduct}>
                    {t('masterdata.product.deactivate')}
                  </Button>
                </div>
              ) : null}
            </div>
          {selectedProduct ? (
            <>
              <div className="product-detail-layout">
                <div className="product-photo">
                  {selectedProduct.image_url ? (
                    <Image
                      alt={t('masterdata.product.imageAlt', { name: selectedProduct.cn_name })}
                      height="100%"
                      preview={{ mask: t('masterdata.product.viewLargeImage') }}
                      src={selectedProduct.image_url}
                      width="100%"
                    />
                  ) : (
                    <span>{t('masterdata.product.noImage')}</span>
                  )}
                </div>
                <dl className="detail-list">
                  <div>
                    <dt>{t('masterdata.product.field.cnName')}</dt>
                    <dd>{selectedProduct.cn_name}</dd>
                  </div>
                  <div>
                    <dt>{t('masterdata.product.field.enName')}</dt>
                    <dd>{selectedProduct.en_name}</dd>
                  </div>
                  <div>
                    <dt>{t('masterdata.product.field.specificationModel')}</dt>
                    <dd>
                      {selectedProduct.specification ?? t('masterdata.product.notFilled')} /{' '}
                      {selectedProduct.model ?? t('masterdata.product.notFilled')}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('masterdata.product.field.customsCode')}</dt>
                    <dd>{selectedProduct.customs_code}</dd>
                  </div>
                  <div>
                    <dt>{t('masterdata.product.field.taxRebateRate')}</dt>
                    <dd>{selectedProduct.tax_rate} / {selectedProduct.rebate_rate}</dd>
                  </div>
                  <div>
                    <dt>{t('masterdata.product.field.status')}</dt>
                    <dd>
                      {selectedProduct.status === 'active'
                        ? t('status.active')
                        : t('status.inactive')}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('masterdata.product.field.packageInfo')}</dt>
                    <dd>{selectedProduct.package_info}</dd>
                  </div>
                </dl>
              </div>

              <div className="compact-section section-actions">
                <Button icon={<Plus size={16} />} onClick={openCreateAccessory}>
                  {t('masterdata.product.accessory.add')}
                </Button>
              </div>

              <Table
                className="compact-section"
                columns={[
                  { title: t('masterdata.product.field.accessoryName'), dataIndex: 'accessory_name' },
                  { title: t('masterdata.product.field.unitConsumption'), dataIndex: 'unit_consumption' },
                  { title: t('masterdata.product.field.unit'), dataIndex: 'unit' },
                  {
                    title: t('masterdata.product.field.defaultSupplier'),
                    dataIndex: 'default_supplier_name',
                  },
                  {
                    title: t('masterdata.product.field.purchaseSplit'),
                    dataIndex: 'purchase_split_rule',
                    render: accessoryRuleLabel,
                  },
                  {
                    title: t('masterdata.product.field.actions'),
                    width: 150,
                    render: (_, record) => (
                      <div className="table-actions">
                        <Button size="small" onClick={() => openEditAccessory(record)}>
                          {t('common.edit')}
                        </Button>
                        <Button danger size="small" onClick={() => confirmDeleteAccessory(record)}>
                          {t('common.delete')}
                        </Button>
                      </div>
                    ),
                  },
                ]}
                dataSource={selectedProduct.accessories}
                pagination={false}
                rowKey="id"
                size="small"
              />

              <div className="compact-section">
                <PanelTitle icon={<Users size={16} />} title={t('masterdata.product.related.title')} />
                <Table<ProductCustomer>
                  columns={[
                    { title: t('masterdata.product.related.customer'), dataIndex: 'customer_name' },
                    {
                      title: t('masterdata.product.related.contractCount'),
                      dataIndex: 'contract_count',
                      width: 90,
                    },
                    {
                      title: t('masterdata.product.related.totalQuantity'),
                      dataIndex: 'total_quantity',
                      width: 110,
                    },
                    {
                      title: t('masterdata.product.related.totalAmount'),
                      dataIndex: 'total_amount',
                      width: 120,
                    },
                    {
                      title: t('masterdata.product.related.lastContract'),
                      dataIndex: 'last_contract_date',
                      width: 130,
                    },
                  ]}
                  dataSource={relatedCustomers}
                  locale={{ emptyText: t('masterdata.product.related.empty') }}
                  pagination={false}
                  rowKey={(record) => record.customer_id ?? record.customer_name}
                  size="small"
                />
              </div>

              <div className="compact-section">
                <PanelTitle
                  icon={<LayoutDashboard size={16} />}
                  title={t('masterdata.product.transactions.title')}
                />
                <Table<ProductTransaction>
                  columns={[
                    {
                      title: t('masterdata.product.transactions.source'),
                      dataIndex: 'source_type',
                      width: 110,
                      render: productTransactionSourceLabel,
                    },
                    {
                      title: t('masterdata.product.transactions.sourceCode'),
                      dataIndex: 'source_code',
                      width: 160,
                    },
                    {
                      title: t('masterdata.product.transactions.date'),
                      dataIndex: 'occurred_at',
                      width: 120,
                    },
                    {
                      title: t('masterdata.product.transactions.counterparty'),
                      dataIndex: 'counterparty_name',
                      width: 150,
                    },
                    {
                      title: t('masterdata.product.transactions.quantity'),
                      width: 120,
                      render: (_, record) =>
                        record.quantity ? `${record.quantity} ${record.unit ?? ''}` : '-',
                    },
                    {
                      title: t('masterdata.product.transactions.amount'),
                      dataIndex: 'amount',
                      width: 120,
                    },
                    {
                      title: t('masterdata.product.transactions.summary'),
                      dataIndex: 'summary',
                    },
                  ]}
                  dataSource={transactions}
                  locale={{ emptyText: t('masterdata.product.transactions.empty') }}
                  pagination={false}
                  rowKey={(record) => `${record.source_type}-${record.source_code}-${record.occurred_at}`}
                  size="small"
                />
              </div>

              {exportResult ? (
                <section className="export-preview compact-section">
                  <strong>{exportResult.filename}</strong>
                  <pre>{exportResult.content.slice(0, 1200)}</pre>
                </section>
              ) : null}
            </>
          ) : (
            <div className="module-state panel-empty-state">
              <LayoutDashboard size={28} />
              <strong>{t('masterdata.product.empty.title')}</strong>
              <span>{t('masterdata.product.empty.description')}</span>
            </div>
          )}
          </section>
        ) : null}
      </section>

      <Modal
        centered
        footer={null}
        open={Boolean(productModalMode)}
        title={
          productModalMode === 'edit'
            ? t('masterdata.product.edit')
            : t('masterdata.product.create')
        }
        width={1040}
        onCancel={() => setProductModalMode(null)}
      >
        <form className="record-form entity-modal-form" onSubmit={submitProduct}>
          <div className="entity-modal-grid">
            <label>
              {t('masterdata.product.field.productCode')}
              <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
            </label>
            <label>
              {t('masterdata.product.field.productUnit')}
              <Input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
            </label>
            <label>
              {t('masterdata.product.field.cnName')}
              <Input value={form.cn_name} onChange={(event) => setForm({ ...form, cn_name: event.target.value })} />
            </label>
            <label>
              {t('masterdata.product.field.enName')}
              <Input value={form.en_name} onChange={(event) => setForm({ ...form, en_name: event.target.value })} />
            </label>
            <label>
              {t('masterdata.product.field.specification')}
              <Input
                value={form.specification}
                onChange={(event) => setForm({ ...form, specification: event.target.value })}
              />
            </label>
            <label>
              {t('masterdata.product.field.model')}
              <Input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} />
            </label>
            <label>
              {t('masterdata.product.field.customsCode')}
              <Input
                value={form.customs_code}
                onChange={(event) => setForm({ ...form, customs_code: event.target.value })}
              />
            </label>
            <label>
              {t('masterdata.product.field.status')}
              <Select
                options={productStatusOptions()}
                value={form.status}
                onChange={(value) => setForm({ ...form, status: value })}
              />
            </label>
            <label>
              {t('masterdata.product.field.taxRate')}
              <Input
                type="number"
                max="1"
                min="0"
                step="0.01"
                value={form.tax_rate}
                onChange={(event) => setForm({ ...form, tax_rate: event.target.value })}
              />
            </label>
            <label>
              {t('masterdata.product.field.rebateRate')}
              <Input
                type="number"
                max="1"
                min="0"
                step="0.01"
                value={form.rebate_rate}
                onChange={(event) => setForm({ ...form, rebate_rate: event.target.value })}
              />
            </label>
            <div className="entity-modal-span product-image-field">
              <span className="product-image-field-label">
                {t('masterdata.product.field.image')}
              </span>
              <div className="product-image-uploader">
                {form.image_url ? (
                  <div className="product-image-preview">
                    <img src={form.image_url} alt={t('masterdata.product.imagePreviewAlt')} />
                    <button
                      className="product-image-remove"
                      type="button"
                      onClick={() => setForm({ ...form, image_url: '' })}
                    >
                      {t('masterdata.product.removeImage')}
                    </button>
                  </div>
                ) : null}
                <label className="product-image-upload">
                  <input
                    accept="image/*"
                    aria-label={
                      form.image_url
                        ? t('masterdata.product.changeImageAria')
                        : t('masterdata.product.uploadImageAria')
                    }
                    type="file"
                    onChange={handleImageFileChange}
                  />
                  <ImagePlus size={18} />
                  <span>
                    {form.image_url
                      ? t('masterdata.product.changeImage')
                      : t('masterdata.product.uploadImage')}
                  </span>
                </label>
                <p className="product-image-hint">{t('masterdata.product.imageHint')}</p>
              </div>
            </div>
            <label className="entity-modal-span">
              {t('masterdata.product.field.packageInfo')}
              <Input.TextArea
                rows={4}
                value={form.package_info}
                onChange={(event) => setForm({ ...form, package_info: event.target.value })}
              />
            </label>
          </div>

          {productModalMode === 'create' ? (
            <div className="entity-modal-section">
              <div className="form-divider">{t('masterdata.product.accessory.firstHint')}</div>
              <div className="entity-modal-grid">
                <label>
                  {t('masterdata.product.field.accessoryName')}
                  <Input
                    value={form.accessory_name}
                    onChange={(event) => setForm({ ...form, accessory_name: event.target.value })}
                  />
                </label>
                <label>
                  {t('masterdata.product.field.unitConsumption')}
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.accessory_unit_consumption}
                    onChange={(event) =>
                      setForm({ ...form, accessory_unit_consumption: event.target.value })
                    }
                  />
                </label>
                <label>
                  {t('masterdata.product.field.accessoryUnit')}
                  <Input
                    value={form.accessory_unit}
                    onChange={(event) => setForm({ ...form, accessory_unit: event.target.value })}
                  />
                </label>
                <label>
                  {t('masterdata.product.field.defaultSupplier')}
                  <Input
                    value={form.accessory_supplier}
                    onChange={(event) => setForm({ ...form, accessory_supplier: event.target.value })}
                  />
                </label>
                <label>
                  {t('masterdata.product.field.purchaseSplit')}
                  <Select
                    options={accessoryRuleOptions()}
                    value={form.accessory_rule}
                    onChange={(value) => setForm({ ...form, accessory_rule: value })}
                  />
                </label>
              </div>
            </div>
          ) : null}

          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={() => setProductModalMode(null)}>
              {t('common.cancel')}
            </button>
            <button className="inline-submit" disabled={submitting} type="submit">
              {productModalMode === 'edit'
                ? t('masterdata.product.save')
                : t('masterdata.product.create')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        centered
        footer={null}
        open={Boolean(accessoryModalMode)}
        title={
          accessoryModalMode === 'edit'
            ? t('masterdata.product.accessory.edit')
            : t('masterdata.product.accessory.add')
        }
        width={720}
        onCancel={() => setAccessoryModalMode(null)}
      >
        <form className="record-form entity-modal-form" onSubmit={submitAccessory}>
          <div className="entity-modal-grid two">
            <label>
              {t('masterdata.product.field.accessoryName')}
              <Input
                value={accessoryForm.accessory_name}
                onChange={(event) =>
                  setAccessoryForm({ ...accessoryForm, accessory_name: event.target.value })
                }
              />
            </label>
            <label>
              {t('masterdata.product.field.unitConsumption')}
              <Input
                type="number"
                min="0"
                step="0.01"
                value={accessoryForm.unit_consumption}
                onChange={(event) =>
                  setAccessoryForm({ ...accessoryForm, unit_consumption: event.target.value })
                }
              />
            </label>
            <label>
              {t('masterdata.product.field.unit')}
              <Input
                value={accessoryForm.unit}
                onChange={(event) => setAccessoryForm({ ...accessoryForm, unit: event.target.value })}
              />
            </label>
            <label>
              {t('masterdata.product.field.defaultSupplier')}
              <Input
                value={accessoryForm.supplier}
                onChange={(event) => setAccessoryForm({ ...accessoryForm, supplier: event.target.value })}
              />
            </label>
            <label className="entity-modal-span">
              {t('masterdata.product.field.purchaseSplit')}
              <Select
                options={accessoryRuleOptions()}
                value={accessoryForm.rule}
                onChange={(value) => setAccessoryForm({ ...accessoryForm, rule: value })}
              />
            </label>
          </div>
          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={() => setAccessoryModalMode(null)}>
              {t('common.cancel')}
            </button>
            <button className="inline-submit" disabled={submitting} type="submit">
              {accessoryModalMode === 'edit'
                ? t('masterdata.product.accessory.save')
                : t('masterdata.product.accessory.add')}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        centered
        footer={null}
        open={importModalOpen}
        title={t('masterdata.product.import.title')}
        width={680}
        onCancel={() => setImportModalOpen(false)}
      >
        <div className="record-form entity-modal-form">
          <p className="product-image-hint">{t('masterdata.product.import.hint')}</p>
          <Upload.Dragger
            accept=".csv,.xlsx"
            beforeUpload={(file) => {
              void submitImport(file as unknown as File)
              return false
            }}
            disabled={importing}
            maxCount={1}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <UploadIcon size={28} />
            </p>
            <p className="ant-upload-text">
              {importing
                ? t('masterdata.product.import.importing')
                : t('masterdata.product.import.drop')}
            </p>
          </Upload.Dragger>

          {importResult ? (
            <div className="compact-section">
              <Alert
                type={importResult.failed > 0 ? 'warning' : 'success'}
                showIcon
                message={t('masterdata.product.import.result', {
                  created: importResult.created,
                  updated: importResult.updated,
                  failed: importResult.failed,
                })}
              />
              {importResult.errors.length > 0 ? (
                <Table
                  className="compact-section"
                  columns={[
                    { title: t('masterdata.product.import.row'), dataIndex: 'row', width: 80 },
                    {
                      title: t('masterdata.product.field.code'),
                      dataIndex: 'code',
                      width: 140,
                    },
                    { title: t('masterdata.product.import.reason'), dataIndex: 'message' },
                  ]}
                  dataSource={importResult.errors}
                  pagination={false}
                  rowKey={(record) => `${record.row}`}
                  size="small"
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </Modal>
    </section>
  )
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error(t('masterdata.product.fileReadFailed')))
    }
    reader.onerror = () => reject(reader.error ?? new Error(t('masterdata.product.fileReadFailed')))
    reader.readAsDataURL(file)
  })
}


function validateProductForm(form: ProductFormState): string | null {
  if (!form.code.trim()) return t('masterdata.product.validation.codeRequired')
  if (!form.cn_name.trim()) return t('masterdata.product.validation.cnNameRequired')
  if (!form.customs_code.trim()) return t('masterdata.product.validation.customsCodeRequired')
  if (!form.unit.trim()) return t('masterdata.product.validation.unitRequired')
  return null
}

function initialProductForm(): ProductFormState {
  return {
    code: '',
    cn_name: '',
    en_name: '',
    specification: '',
    model: '',
    customs_code: '',
    tax_rate: '0.13',
    rebate_rate: '0.09',
    package_info: '',
    unit: 'pcs',
    image_url: '',
    status: 'active',
    accessory_name: '',
    accessory_unit_consumption: '1',
    accessory_unit: 'pcs',
    accessory_supplier: '',
    accessory_rule: 'by_supplier',
  }
}

function initialProductAccessoryForm(): ProductAccessoryFormState {
  return {
    accessory_name: '',
    unit_consumption: '1',
    unit: 'pcs',
    supplier: '',
    rule: 'by_supplier',
  }
}

function productToForm(product: Product): ProductFormState {
  return {
    code: product.code,
    cn_name: product.cn_name,
    en_name: product.en_name,
    specification: product.specification ?? '',
    model: product.model ?? '',
    customs_code: product.customs_code,
    tax_rate: product.tax_rate,
    rebate_rate: product.rebate_rate,
    package_info: product.package_info,
    unit: product.unit,
    image_url: product.image_url ?? '',
    status: product.status,
    accessory_name: '',
    accessory_unit_consumption: '1',
    accessory_unit: 'pcs',
    accessory_supplier: '',
    accessory_rule: 'by_supplier',
  }
}

function productPayload(form: ProductFormState): ProductCreatePayload {
  const accessory = initialAccessoryPayload(form)
  return {
    code: form.code.trim(),
    cn_name: form.cn_name.trim(),
    en_name: form.en_name.trim(),
    specification: emptyToNull(form.specification),
    model: emptyToNull(form.model),
    customs_code: form.customs_code.trim(),
    tax_rate: form.tax_rate,
    rebate_rate: form.rebate_rate,
    package_info: form.package_info.trim(),
    unit: form.unit.trim(),
    image_url: emptyToNull(form.image_url),
    status: form.status,
    accessories: accessory.accessory_name ? [accessory] : [],
  }
}

function productUpdatePayload(form: ProductFormState): ProductUpdatePayload {
  return {
    code: form.code.trim(),
    cn_name: form.cn_name.trim(),
    en_name: form.en_name.trim(),
    specification: emptyToNull(form.specification),
    model: emptyToNull(form.model),
    customs_code: form.customs_code.trim(),
    tax_rate: form.tax_rate,
    rebate_rate: form.rebate_rate,
    package_info: form.package_info.trim(),
    unit: form.unit.trim(),
    image_url: emptyToNull(form.image_url),
    status: form.status,
  }
}

function initialAccessoryPayload(form: ProductFormState): ProductAccessoryPayload {
  return {
    accessory_name: form.accessory_name.trim(),
    unit_consumption: form.accessory_unit_consumption,
    unit: form.accessory_unit.trim(),
    default_supplier_name: emptyToNull(form.accessory_supplier),
    purchase_split_rule: form.accessory_rule,
  }
}

function productAccessoryToForm(accessory: Product['accessories'][number]): ProductAccessoryFormState {
  return {
    accessory_name: accessory.accessory_name,
    unit_consumption: accessory.unit_consumption,
    unit: accessory.unit,
    supplier: accessory.default_supplier_name ?? '',
    rule: accessory.purchase_split_rule,
  }
}

function accessoryPayload(form: ProductAccessoryFormState): ProductAccessoryPayload {
  return {
    accessory_name: form.accessory_name.trim(),
    unit_consumption: form.unit_consumption,
    unit: form.unit.trim(),
    default_supplier_name: emptyToNull(form.supplier),
    purchase_split_rule: form.rule,
  }
}

function accessoryRuleLabel(value: string): string {
  return value === 'by_accessory'
    ? t('masterdata.product.accessoryRule.byAccessory')
    : t('masterdata.product.accessoryRule.bySupplier')
}

function productTransactionSourceLabel(value: string): string {
  const labels: Record<string, TranslationKey> = {
    export_quotation: 'masterdata.product.transactions.sourceType.exportQuotation',
    export_contract: 'masterdata.product.transactions.sourceType.exportContract',
    shipment: 'masterdata.product.transactions.sourceType.shipment',
    purchase_inquiry: 'masterdata.product.transactions.sourceType.purchaseInquiry',
    purchase_contract: 'masterdata.product.transactions.sourceType.purchaseContract',
    inventory_ledger: 'masterdata.product.transactions.sourceType.inventoryLedger',
  }
  const key = labels[value]
  return key ? t(key) : value
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}
