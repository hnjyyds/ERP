import { Alert, Button, Image, Input, Modal, Select, Table, Tag, Upload } from 'antd'
import {
  ArrowLeft,
  FilePenLine,
  ImagePlus,
  LayoutDashboard,
  Plus,
  RefreshCw,
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
  exportProducts,
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
import { productDetailPath, productPath } from '../../routes'

const productColumnOptions: ColumnOption[] = [
  { key: 'code', title: '编号', required: true },
  { key: 'cn_name', title: '中文名称' },
  { key: 'en_name', title: '英文名称' },
  { key: 'customs_code', title: '海关编码' },
  { key: 'unit', title: '单位' },
  { key: 'status', title: '状态' },
  { key: 'accessories', title: '配件' },
]

const productStatusOptions = [
  { value: 'active', label: '启用' },
  { value: 'inactive', label: '停用' },
]

const maxProductImageBytes = 2_000_000

const accessoryRuleOptions = [
  { value: 'by_supplier', label: '按供应商分单' },
  { value: 'by_accessory', label: '按配件分单' },
]

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
  const [error, setError] = useState('')
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

  const { isVisible: isColumnVisible, control: columnViewControl } = useColumnView(
    'masterdata-products',
    productColumnOptions,
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

  async function loadProducts(preferredId?: string) {
    setLoading(true)
    setError('')
    try {
      const result = await listProducts(search.trim() || undefined)
      setProducts(result.items)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedProductId) ? selectedProductId : null) ??
        result.items[0]?.id ??
        null
      setSelectedProductId(nextSelectedId)
    } catch (caught) {
      showError(caught, '商品资料加载失败')
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
    setError('')
    setExportResult(null)
    try {
      if (productModalMode === 'edit' && selectedProduct) {
        const updated = await updateProduct(selectedProduct.id, productUpdatePayload(form))
        setMessage(`已保存商品 ${updated.code}`)
        setProductModalMode(null)
        await loadProducts(updated.id)
        return
      }
      const created = await createProduct(productPayload(form))
      setMessage(`已新增商品 ${created.code}`)
      setForm(initialProductForm())
      setProductModalMode(null)
      await loadProducts(created.id)
    } catch (caught) {
      showError(caught, '商品保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  function handleImageFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showWarningDialog('请选择图片文件')
      return
    }
    if (file.size > maxProductImageBytes) {
      showWarningDialog('图片需小于 2MB')
      return
    }
    void (async () => {
      try {
        const dataUrl = await readFileAsDataUrl(file)
        // 上传到对象存储，表单保存返回的可访问 URL（而非 base64）。
        const uploaded = await uploadImage(file.name, dataUrl)
        setForm((current) => ({ ...current, image_url: uploaded.url }))
      } catch (caught) {
        showError(caught, '图片上传失败')
      }
    })()
  }

  async function submitImport(file: File) {
    setImporting(true)
    setMessage('')
    setError('')
    try {
      const dataUrl = await readFileAsDataUrl(file)
      const result = await importProducts(file.name, dataUrl)
      setImportResult(result)
      setMessage(`导入完成：新增 ${result.created}，更新 ${result.updated}，失败 ${result.failed}`)
      await loadProducts()
    } catch (caught) {
      showError(caught, '商品导入失败')
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
    setError('')
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
          ? `已保存配件 ${accessory.accessory_name}`
          : `已追加配件 ${accessory.accessory_name}`,
      )
      setAccessoryForm(initialProductAccessoryForm())
      setAccessoryModalMode(null)
      setEditingAccessoryId(null)
    } catch (caught) {
      showError(caught, '配件保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  function confirmDeactivateProduct() {
    if (!selectedProduct) return
    Modal.confirm({
      title: `停用商品 ${selectedProduct.code}`,
      content: '停用后商品将不再出现在默认列表和业务选择中，历史单据仍可追溯。',
      okText: '停用',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const deactivated = await deactivateProduct(selectedProduct.id)
          setMessage(`已停用商品 ${deactivated.code}`)
          await loadProducts()
        } catch (caught) {
          showError(caught, '商品停用失败')
        }
      },
    })
  }

  function confirmDeleteAccessory(accessory: Product['accessories'][number]) {
    if (!selectedProduct) return
    Modal.confirm({
      title: `删除配件 ${accessory.accessory_name}`,
      content: '删除后该配件不会再参与商品配件拆分。',
      okText: '删除',
      cancelText: '取消',
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
          setMessage(`已删除配件 ${accessory.accessory_name}`)
        } catch (caught) {
          showError(caught, '配件删除失败')
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
      showWarningDialog('请先选择要导出的商品，或直接导出全部')
      return
    }
    const headers = ['编号', '中文名称', '英文名称', '规格', '型号', '海关编码', '退税率', '包装信息', '单位', '状态']
    const csvRows = toExport.map((p) => [
      p.code, p.cn_name, p.en_name, p.specification ?? '', p.model ?? '',
      p.customs_code, p.rebate_rate, p.package_info, p.unit,
      p.status === 'active' ? '启用' : '停用',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    const csv = [headers.join(','), ...csvRows].join('\n')
    downloadCsv('产品资料.csv', csv)
    showSuccess(`已导出 ${toExport.length} 条商品`)
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
      <div className="summary-strip" aria-label="商品资料概览">
        <Metric label="商品" value={products.length} />
        <Metric label="配件明细" value={products.reduce((sum, item) => sum + item.accessories.length, 0)} />
        <Metric label="有图片" value={products.filter((item) => Boolean(item.image_url)).length} />
        <Metric label="导出" value={exportResult ? 1 : 0} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}
      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

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
              <PanelTitle icon={<Search size={18} />} title="商品列表" />
              <form
                className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadProducts()
                }}
              >
                <label className="inline-filter-search">
                  搜索
                  <Input
                    value={search}
                    placeholder="编号 / 中文 / 英文 / 海关编码"
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  查询
                </Button>
                <Button icon={<Plus size={16} />} onClick={openCreateProduct}>
                  新增商品
                </Button>
                <Button
                  icon={<UploadIcon size={16} />}
                  onClick={() => {
                    setImportResult(null)
                    setImportModalOpen(true)
                  }}
                >
                  导入
                </Button>
                <Button icon={<RefreshCw size={16} />} onClick={exportSelectedCsv}>
                  {selectedRowKeys.length > 0 ? `导出 (${selectedRowKeys.length})` : '导出全部'}
                </Button>
                {columnViewControl}
              </form>
            </div>

            <Table<Product>
              rowSelection={{
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
              }}
              columns={[
                {
                  title: '编号',
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
                { title: '中文名称', dataIndex: 'cn_name' },
                { title: '英文名称', dataIndex: 'en_name' },
                { title: '海关编码', dataIndex: 'customs_code' },
                { title: '单位', dataIndex: 'unit', width: 80 },
                {
                  title: '状态',
                  dataIndex: 'status',
                  width: 90,
                  render: (value: string) => (
                    <Tag color={value === 'active' ? 'success' : 'default'}>
                      {value === 'active' ? '启用' : '停用'}
                    </Tag>
                  ),
                },
                {
                  title: '配件',
                  dataIndex: 'accessories',
                  width: 80,
                  render: (_value: Product['accessories'], record: Product) => record.accessories.length,
                },
                {
                  title: '入口',
                  dataIndex: 'detail',
                  width: 110,
                  render: (_value: unknown, record: Product) => (
                    <Button size="small" onClick={(event) => stopAndOpenProductDetail(event, record)}>
                      查看详情
                    </Button>
                  ),
                },
              ].filter((column) => column.dataIndex === 'detail' || isColumnVisible(column.dataIndex as string))}
              dataSource={products}
              loading={loading}
              pagination={false}
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
              <PanelTitle icon={<LayoutDashboard size={18} />} title="商品明细" />
              {selectedProduct ? (
                <div className="section-actions">
                  <Button icon={<ArrowLeft size={16} />} onClick={() => onNavigate(productPath)}>
                    返回列表
                  </Button>
                  <Button icon={<FilePenLine size={16} />} onClick={openEditProduct}>
                    编辑商品
                  </Button>
                  <Button danger icon={<Trash2 size={16} />} onClick={confirmDeactivateProduct}>
                    停用
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
                      alt={`${selectedProduct.cn_name} 商品图片`}
                      height="100%"
                      preview={{ mask: '查看大图' }}
                      src={selectedProduct.image_url}
                      width="100%"
                    />
                  ) : (
                    <span>暂无图片</span>
                  )}
                </div>
                <dl className="detail-list">
                  <div>
                    <dt>中文名称</dt>
                    <dd>{selectedProduct.cn_name}</dd>
                  </div>
                  <div>
                    <dt>英文名称</dt>
                    <dd>{selectedProduct.en_name}</dd>
                  </div>
                  <div>
                    <dt>规格/型号</dt>
                    <dd>{selectedProduct.specification ?? '未填'} / {selectedProduct.model ?? '未填'}</dd>
                  </div>
                  <div>
                    <dt>海关编码</dt>
                    <dd>{selectedProduct.customs_code}</dd>
                  </div>
                  <div>
                    <dt>税率/退税率</dt>
                    <dd>{selectedProduct.tax_rate} / {selectedProduct.rebate_rate}</dd>
                  </div>
                  <div>
                    <dt>状态</dt>
                    <dd>{selectedProduct.status === 'active' ? '启用' : '停用'}</dd>
                  </div>
                  <div>
                    <dt>包装资料</dt>
                    <dd>{selectedProduct.package_info}</dd>
                  </div>
                </dl>
              </div>

              <div className="compact-section section-actions">
                <Button icon={<Plus size={16} />} onClick={openCreateAccessory}>
                  追加配件
                </Button>
              </div>

              <Table
                className="compact-section"
                columns={[
                  { title: '配件名称', dataIndex: 'accessory_name' },
                  { title: '单耗', dataIndex: 'unit_consumption' },
                  { title: '单位', dataIndex: 'unit' },
                  { title: '默认供应商', dataIndex: 'default_supplier_name' },
                  {
                    title: '采购拆分',
                    dataIndex: 'purchase_split_rule',
                    render: accessoryRuleLabel,
                  },
                  {
                    title: '操作',
                    width: 150,
                    render: (_, record) => (
                      <div className="table-actions">
                        <Button size="small" onClick={() => openEditAccessory(record)}>
                          编辑
                        </Button>
                        <Button danger size="small" onClick={() => confirmDeleteAccessory(record)}>
                          删除
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
                <PanelTitle icon={<Users size={16} />} title="相关客户与交易" />
                <Table<ProductCustomer>
                  columns={[
                    { title: '客户', dataIndex: 'customer_name' },
                    { title: '合同数', dataIndex: 'contract_count', width: 90 },
                    { title: '累计数量', dataIndex: 'total_quantity', width: 110 },
                    { title: '累计金额', dataIndex: 'total_amount', width: 120 },
                    { title: '最近合同', dataIndex: 'last_contract_date', width: 130 },
                  ]}
                  dataSource={relatedCustomers}
                  locale={{ emptyText: '暂无关联客户，出口合同生成后自动汇总' }}
                  pagination={false}
                  rowKey={(record) => record.customer_id ?? record.customer_name}
                  size="small"
                />
              </div>

              <div className="compact-section">
                <PanelTitle icon={<LayoutDashboard size={16} />} title="业务记录" />
                <Table<ProductTransaction>
                  columns={[
                    {
                      title: '来源',
                      dataIndex: 'source_type',
                      width: 110,
                      render: productTransactionSourceLabel,
                    },
                    { title: '单号', dataIndex: 'source_code', width: 160 },
                    { title: '日期', dataIndex: 'occurred_at', width: 120 },
                    { title: '往来方', dataIndex: 'counterparty_name', width: 150 },
                    {
                      title: '数量',
                      width: 120,
                      render: (_, record) =>
                        record.quantity ? `${record.quantity} ${record.unit ?? ''}` : '-',
                    },
                    { title: '金额', dataIndex: 'amount', width: 120 },
                    { title: '摘要', dataIndex: 'summary' },
                  ]}
                  dataSource={transactions}
                  locale={{ emptyText: '暂无业务记录，报价/合同/出货/采购引用该商品后自动汇总' }}
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
              <strong>暂无商品资料</strong>
              <span>请返回列表选择商品查看详情</span>
            </div>
          )}
          </section>
        ) : null}
      </section>

      <Modal
        centered
        footer={null}
        open={Boolean(productModalMode)}
        title={productModalMode === 'edit' ? '编辑商品' : '新增商品'}
        width={1040}
        onCancel={() => setProductModalMode(null)}
      >
        <form className="record-form entity-modal-form" onSubmit={submitProduct}>
          <div className="entity-modal-grid">
            <label>
              产品编号
              <Input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} />
            </label>
            <label>
              商品单位
              <Input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
            </label>
            <label>
              中文名称
              <Input value={form.cn_name} onChange={(event) => setForm({ ...form, cn_name: event.target.value })} />
            </label>
            <label>
              英文名称
              <Input value={form.en_name} onChange={(event) => setForm({ ...form, en_name: event.target.value })} />
            </label>
            <label>
              规格
              <Input
                value={form.specification}
                onChange={(event) => setForm({ ...form, specification: event.target.value })}
              />
            </label>
            <label>
              型号
              <Input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} />
            </label>
            <label>
              海关编码
              <Input
                value={form.customs_code}
                onChange={(event) => setForm({ ...form, customs_code: event.target.value })}
              />
            </label>
            <label>
              状态
              <Select
                options={productStatusOptions}
                value={form.status}
                onChange={(value) => setForm({ ...form, status: value })}
              />
            </label>
            <label>
              税率
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
              退税率
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
              <span className="product-image-field-label">商品图片</span>
              <div className="product-image-uploader">
                {form.image_url ? (
                  <div className="product-image-preview">
                    <img src={form.image_url} alt="商品图片预览" />
                    <button
                      className="product-image-remove"
                      type="button"
                      onClick={() => setForm({ ...form, image_url: '' })}
                    >
                      移除图片
                    </button>
                  </div>
                ) : null}
                <label className="product-image-upload">
                  <input accept="image/*" type="file" onChange={handleImageFileChange} />
                  <ImagePlus size={18} />
                  <span>{form.image_url ? '更换图片' : '上传图片'}</span>
                </label>
                <p className="product-image-hint">支持 PNG、JPG，图片需小于 2MB。</p>
              </div>
            </div>
            <label className="entity-modal-span">
              包装资料
              <Input.TextArea
                rows={4}
                value={form.package_info}
                onChange={(event) => setForm({ ...form, package_info: event.target.value })}
              />
            </label>
          </div>

          {productModalMode === 'create' ? (
            <div className="entity-modal-section">
              <div className="form-divider">首个配件，可留空后续追加</div>
              <div className="entity-modal-grid">
                <label>
                  配件名称
                  <Input
                    value={form.accessory_name}
                    onChange={(event) => setForm({ ...form, accessory_name: event.target.value })}
                  />
                </label>
                <label>
                  单耗
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
                  配件单位
                  <Input
                    value={form.accessory_unit}
                    onChange={(event) => setForm({ ...form, accessory_unit: event.target.value })}
                  />
                </label>
                <label>
                  默认供应商
                  <Input
                    value={form.accessory_supplier}
                    onChange={(event) => setForm({ ...form, accessory_supplier: event.target.value })}
                  />
                </label>
                <label>
                  采购拆分
                  <Select
                    options={accessoryRuleOptions}
                    value={form.accessory_rule}
                    onChange={(value) => setForm({ ...form, accessory_rule: value })}
                  />
                </label>
              </div>
            </div>
          ) : null}

          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={() => setProductModalMode(null)}>
              取消
            </button>
            <button className="inline-submit" disabled={submitting} type="submit">
              {productModalMode === 'edit' ? '保存商品' : '新增商品'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        centered
        footer={null}
        open={Boolean(accessoryModalMode)}
        title={accessoryModalMode === 'edit' ? '编辑配件' : '追加配件'}
        width={720}
        onCancel={() => setAccessoryModalMode(null)}
      >
        <form className="record-form entity-modal-form" onSubmit={submitAccessory}>
          <div className="entity-modal-grid two">
            <label>
              配件名称
              <Input
                value={accessoryForm.accessory_name}
                onChange={(event) =>
                  setAccessoryForm({ ...accessoryForm, accessory_name: event.target.value })
                }
              />
            </label>
            <label>
              单耗
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
              单位
              <Input
                value={accessoryForm.unit}
                onChange={(event) => setAccessoryForm({ ...accessoryForm, unit: event.target.value })}
              />
            </label>
            <label>
              默认供应商
              <Input
                value={accessoryForm.supplier}
                onChange={(event) => setAccessoryForm({ ...accessoryForm, supplier: event.target.value })}
              />
            </label>
            <label className="entity-modal-span">
              采购拆分
              <Select
                options={accessoryRuleOptions}
                value={accessoryForm.rule}
                onChange={(value) => setAccessoryForm({ ...accessoryForm, rule: value })}
              />
            </label>
          </div>
          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={() => setAccessoryModalMode(null)}>
              取消
            </button>
            <button className="inline-submit" disabled={submitting} type="submit">
              {accessoryModalMode === 'edit' ? '保存配件' : '追加配件'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        centered
        footer={null}
        open={importModalOpen}
        title="导入商品资料"
        width={680}
        onCancel={() => setImportModalOpen(false)}
      >
        <div className="record-form entity-modal-form">
          <p className="product-image-hint">
            支持 CSV 与 Excel(.xlsx)。表头需包含：code、cn_name、en_name、customs_code、
            tax_rate、rebate_rate、package_info、unit；税率可写 0.13 或 13%。已存在的编号将被更新。
          </p>
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
              {importing ? '正在导入…' : '点击或拖拽 CSV / Excel 文件到此处'}
            </p>
          </Upload.Dragger>

          {importResult ? (
            <div className="compact-section">
              <Alert
                type={importResult.failed > 0 ? 'warning' : 'success'}
                showIcon
                message={`新增 ${importResult.created} ｜ 更新 ${importResult.updated} ｜ 失败 ${importResult.failed}`}
              />
              {importResult.errors.length > 0 ? (
                <Table
                  className="compact-section"
                  columns={[
                    { title: '行号', dataIndex: 'row', width: 80 },
                    { title: '编号', dataIndex: 'code', width: 140 },
                    { title: '原因', dataIndex: 'message' },
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
      else reject(new Error('文件读取失败'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}


function validateProductForm(form: ProductFormState): string | null {
  if (!form.code.trim()) return '请填写商品编号'
  if (!form.cn_name.trim()) return '请填写商品中文名称'
  if (!form.customs_code.trim()) return '请填写海关编码'
  if (!form.unit.trim()) return '请填写商品单位'
  return null
}

function initialProductForm(): ProductFormState {
  return {
    code: `P-${Date.now().toString().slice(-6)}`,
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
  return value === 'by_accessory' ? '按配件分单' : '按供应商分单'
}

function productTransactionSourceLabel(value: string): string {
  const labels: Record<string, string> = {
    export_quotation: '出口报价',
    export_contract: '出口合同',
    shipment: '出货明细',
    purchase_inquiry: '采购询价',
    purchase_contract: '采购合同',
    inventory_ledger: '库存流水',
  }
  return labels[value] ?? value
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}
