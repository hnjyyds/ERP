import { Alert, Button, Input, Modal, Select, Table, Tag } from 'antd'
import { FilePenLine, ImagePlus, LayoutDashboard, Plus, RefreshCw, Search, Trash2 } from 'lucide-react'
import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'

import {
  addProductAccessory,
  createProduct,
  deactivateProduct,
  deleteProductAccessory,
  exportProducts,
  listProducts,
  updateProduct,
  updateProductAccessory,
  type Product,
  type ProductAccessoryPayload,
  type ProductCreatePayload,
  type ProductExport,
  type ProductUpdatePayload,
} from '../../../api'
import { showError, showWarningDialog } from '../../../shared/errors'
import { Metric, PanelTitle } from '../../../shared/ui'

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

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [exportResult, setExportResult] = useState<ProductExport | null>(null)
  const [form, setForm] = useState<ProductFormState>(() => initialProductForm())
  const [accessoryForm, setAccessoryForm] = useState<ProductAccessoryFormState>(() =>
    initialProductAccessoryForm(),
  )
  const [productModalMode, setProductModalMode] = useState<'create' | 'edit' | null>(null)
  const [accessoryModalMode, setAccessoryModalMode] = useState<'create' | 'edit' | null>(null)
  const [editingAccessoryId, setEditingAccessoryId] = useState<string | null>(null)

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === selectedProductId) ?? products[0] ?? null,
    [products, selectedProductId],
  )

  useEffect(() => {
    void loadProducts()
  }, [])

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
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        showWarningDialog('图片读取失败，请重试')
        return
      }
      setForm((current) => ({ ...current, image_url: reader.result as string }))
    }
    reader.onerror = () => showWarningDialog('图片读取失败，请重试')
    reader.readAsDataURL(file)
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

  async function exportProductCsv() {
    setMessage('')
    setError('')
    try {
      const result = await exportProducts()
      setExportResult(result)
      setMessage(`CSV 已生成：${result.filename}`)
    } catch (caught) {
      showError(caught, '商品导出失败')
    }
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

      <section className="business-grid product-business-grid">
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
              <Button icon={<RefreshCw size={16} />} onClick={exportProductCsv}>
                导出
              </Button>
            </form>
          </div>

          <Table<Product>
            columns={[
              {
                title: '编号',
                dataIndex: 'code',
                render: (value: string) => <button className="row-button" type="button">{value}</button>,
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
                render: (_, record) => record.accessories.length,
              },
            ]}
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

        <section className="workspace-panel detail-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<LayoutDashboard size={18} />} title="商品明细" />
            {selectedProduct ? (
              <div className="section-actions">
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
                    <img src={selectedProduct.image_url} alt="" />
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
              <span>请选择上方列表中的商品查看详情</span>
            </div>
          )}
        </section>
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
    </section>
  )
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

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}
