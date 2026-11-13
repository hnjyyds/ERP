import { Alert, Modal } from 'antd'
import type { ChangeEvent, FormEvent } from 'react'
import { useState } from 'react'

import {
  addProductAccessory,
  createProduct,
  deactivateProduct,
  deleteProductAccessory,
  importProducts,
  updateProduct,
  updateProductAccessory,
  uploadImage,
  type Product,
  type ProductExport,
  type ProductImportResult,
} from '@/api'
import { showError, showSuccess, showWarningDialog } from '@/shared/errors'
import { downloadCsv } from '@/shared/print'
import { Metric } from '@/shared/ui'
import { t } from '@/app/appI18n'
import { productDetailPath, productPath } from '@/app/routes'

import { useProductsPage } from './products/hooks/useProductsPage'
import { ProductsListView } from './products/views/ProductsListView'
import { ProductDetailView } from './products/views/ProductDetailView'
import { ProductFormModal } from './products/forms/ProductFormModal'
import { ProductAccessoryModal } from './products/forms/ProductAccessoryModal'
import { ProductImportModal } from './products/forms/ProductImportModal'
import {
  accessoryPayload,
  initialProductAccessoryForm,
  initialProductForm,
  maxProductImageBytes,
  productAccessoryToForm,
  productPayload,
  productToForm,
  productUpdatePayload,
  readFileAsDataUrl,
  validateProductForm,
  type ProductAccessoryFormState,
  type ProductFormState,
} from './products/productHelpers'

type ProductsPageProps = {
  detailId: string | null
  onNavigate: (path: string) => void
}

export function ProductsPage({ detailId, onNavigate }: ProductsPageProps) {
  const model = useProductsPage({ detailId, onNavigate })
  const [productSubmitting, setProductSubmitting] = useState(false)
  const [accessorySubmitting, setAccessorySubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [exportResult, setExportResult] = useState<ProductExport | null>(null)
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

  function openCreateProduct() {
    setForm(initialProductForm())
    setProductModalMode('create')
    setExportResult(null)
  }

  function openEditProduct() {
    if (!model.selectedProduct) return
    setForm(productToForm(model.selectedProduct))
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
    setProductSubmitting(true)
    setMessage('')
    setExportResult(null)
    try {
      if (productModalMode === 'edit' && model.selectedProduct) {
        const updated = await updateProduct(model.selectedProduct.id, productUpdatePayload(form))
        setMessage(t('masterdata.product.saved', { code: updated.code }))
        setProductModalMode(null)
        await model.loadProducts(updated.id)
        return
      }
      const created = await createProduct(productPayload(form))
      setMessage(t('masterdata.product.created', { code: created.code }))
      setForm(initialProductForm())
      setProductModalMode(null)
      await model.resetToFirstPage(created.id)
    } catch (caught) {
      showError(caught, t('masterdata.product.saveFailed'))
    } finally {
      setProductSubmitting(false)
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
      await model.loadProducts()
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
    const selectedProduct = model.selectedProduct
    if (!selectedProduct) return
    setAccessorySubmitting(true)
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
      model.setProducts((current) =>
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
      setAccessorySubmitting(false)
    }
  }

  function confirmDeactivateProduct() {
    const selectedProduct = model.selectedProduct
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
          await model.loadProducts()
        } catch (caught) {
          showError(caught, t('masterdata.product.deactivateFailed'))
        }
      },
    })
  }

  function confirmDeleteAccessory(accessory: Product['accessories'][number]) {
    const selectedProduct = model.selectedProduct
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
          model.setProducts((current) =>
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
    const selectedIds = new Set(model.selectedRowKeys.map(String))
    const toExport =
      selectedIds.size > 0
        ? model.products.filter((p) => selectedIds.has(p.id))
        : model.products
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
    const csvRows = toExport.map((p) =>
      [
        p.code,
        p.cn_name,
        p.en_name,
        p.specification ?? '',
        p.model ?? '',
        p.customs_code,
        p.rebate_rate,
        p.package_info,
        p.unit,
        p.status === 'active' ? t('status.active') : t('status.inactive'),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    )
    const csv = [headers.join(','), ...csvRows].join('\n')
    downloadCsv(t('masterdata.product.exportFileName'), csv)
    showSuccess(t('masterdata.product.exportSuccess', { count: toExport.length }))
  }

  function openProductDetail(product: Product) {
    model.setSelectedProductId(product.id)
    onNavigate(productDetailPath(product.id))
  }

  return (
    <section className="masterdata-page product-page">
      <div className="summary-strip" aria-label={t('masterdata.product.overviewAria')}>
        <Metric label={t('masterdata.product.metric.products')} value={model.total} />
        <Metric
          label={t('masterdata.product.metric.accessories')}
          value={model.summary.accessory_count}
        />
        <Metric
          label={t('masterdata.product.metric.withImage')}
          value={model.summary.with_image_count}
        />
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
          <ProductsListView
            model={model}
            onCreate={openCreateProduct}
            onExport={exportSelectedCsv}
            onOpenDetail={openProductDetail}
            onOpenImport={() => {
              setImportResult(null)
              setImportModalOpen(true)
            }}
          />
        ) : null}

        {detailId ? (
          <ProductDetailView
            customers={model.relatedCustomers}
            exportResult={exportResult}
            loading={model.detailLoading}
            product={model.selectedProduct}
            transactions={model.transactions}
            onAddAccessory={openCreateAccessory}
            onBack={() => onNavigate(productPath)}
            onDeactivate={confirmDeactivateProduct}
            onDeleteAccessory={confirmDeleteAccessory}
            onEdit={openEditProduct}
            onEditAccessory={openEditAccessory}
          />
        ) : null}
      </section>

      <ProductFormModal
        form={form}
        mode={productModalMode}
        setForm={setForm}
        submitting={productSubmitting}
        onCancel={() => setProductModalMode(null)}
        onImageFileChange={handleImageFileChange}
        onSubmit={submitProduct}
      />

      <ProductAccessoryModal
        form={accessoryForm}
        mode={accessoryModalMode}
        setForm={setAccessoryForm}
        submitting={accessorySubmitting}
        onCancel={() => setAccessoryModalMode(null)}
        onSubmit={submitAccessory}
      />

      <ProductImportModal
        importing={importing}
        open={importModalOpen}
        result={importResult}
        onClose={() => setImportModalOpen(false)}
        onSelectFile={(file) => {
          void submitImport(file)
        }}
      />
    </section>
  )
}
