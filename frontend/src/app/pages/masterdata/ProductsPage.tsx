import { Alert, Modal } from 'antd'
import type { FormEvent } from 'react'
import { useState } from 'react'

import {
  addProductAccessory,
  createProduct,
  deactivateProduct,
  deleteProductAccessory,
  importProducts,
  listProducts,
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
  type ProductFormError,
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
  const [formError, setFormError] = useState<ProductFormError | null>(null)
  const [imageErrors, setImageErrors] = useState<Record<number, string>>({})
  const [addImageError, setAddImageError] = useState('')
  const [imageUploading, setImageUploading] = useState(false)

  function resetImageState() {
    setImageErrors({})
    setAddImageError('')
  }

  function openCreateProduct() {
    setForm(initialProductForm())
    setFormError(null)
    resetImageState()
    setProductModalMode('create')
    setExportResult(null)
  }

  function openEditProduct() {
    if (!model.selectedProduct) return
    setForm(productToForm(model.selectedProduct))
    setFormError(null)
    resetImageState()
    setProductModalMode('edit')
    setExportResult(null)
  }

  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const missing = validateProductForm(form, productModalMode === 'edit' ? 'edit' : 'create')
    if (missing) {
      // 字段旁同步保留错误提示，避免只依赖 3 秒后消失的顶部提示。
      setFormError(missing)
      showWarningDialog(missing.message)
      return
    }
    setFormError(null)
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

  function imageFileError(file: File): string | null {
    if (!file.type.startsWith('image/')) return t('masterdata.product.imageTypeInvalid')
    if (file.size > maxProductImageBytes) return t('masterdata.product.imageTooLarge')
    return null
  }

  async function uploadProductImage(file: File): Promise<string> {
    const dataUrl = await readFileAsDataUrl(file)
    // 上传到对象存储，表单保存返回的可访问 URL（而非 base64）。
    const uploaded = await uploadImage(file.name, dataUrl)
    return uploaded.url
  }

  async function addProductImages(files: File[]) {
    if (files.length === 0 || imageUploading) return
    setImageUploading(true)
    setAddImageError('')
    const uploadedUrls: string[] = []
    let failure = ''
    for (const file of files) {
      const invalid = imageFileError(file)
      if (invalid) {
        failure = invalid
        continue
      }
      try {
        uploadedUrls.push(await uploadProductImage(file))
      } catch {
        failure = t('masterdata.product.imageUploadFailed')
      }
    }
    if (uploadedUrls.length > 0) {
      setForm((current) => ({ ...current, images: [...current.images, ...uploadedUrls] }))
    }
    setAddImageError(failure)
    setImageUploading(false)
  }

  async function replaceProductImage(index: number, file: File) {
    if (imageUploading) return
    const invalid = imageFileError(file)
    if (invalid) {
      setImageErrors((current) => ({ ...current, [index]: invalid }))
      return
    }
    setImageUploading(true)
    setImageErrors((current) => {
      const next = { ...current }
      delete next[index]
      return next
    })
    try {
      const url = await uploadProductImage(file)
      // 仅在替换成功后改写该位置，失败时保留原图。
      setForm((current) => {
        const images = [...current.images]
        if (index < images.length) images[index] = url
        return { ...current, images }
      })
    } catch {
      setImageErrors((current) => ({
        ...current,
        [index]: t('masterdata.product.imageReplaceFailed'),
      }))
    } finally {
      setImageUploading(false)
    }
  }

  function removeProductImage(index: number) {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, position) => position !== index),
    }))
    // 删除后下标会前移，清空旧错误避免挂到其他图片上。
    setImageErrors({})
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

  /** 分页拉取当前关键词下的全部商品，供“导出全部”使用。 */
  async function fetchAllFilteredProducts(query: string): Promise<Product[]> {
    const pageSize = 200
    const items: Product[] = []
    let offset = 0
    let total = 0
    do {
      const result = await listProducts({
        q: query.trim() || undefined,
        limit: pageSize,
        offset,
      })
      total = result.total
      items.push(...result.items)
      if (result.items.length === 0) break
      offset += result.items.length
    } while (items.length < total)
    return items
  }

  async function exportSelectedCsv() {
    const selectedIds = new Set(model.selectedRowKeys.map(String))
    let toExport: Product[]
    if (selectedIds.size > 0) {
      toExport = model.products.filter((p) => selectedIds.has(p.id))
    } else {
      // “导出全部”覆盖当前筛选范围的全部页，而不是仅已加载的当前页。
      try {
        toExport = await fetchAllFilteredProducts(model.search)
      } catch (caught) {
        showError(caught, t('masterdata.product.exportFailed'))
        return
      }
    }
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
      {/* 统计条只服务列表筛选；详情页改为在图片区显示当前商品的图片数量。 */}
      {!detailId ? (
        <div className="summary-strip" aria-label={t('masterdata.product.overviewAria')}>
          <Metric label={t('masterdata.product.metric.products')} value={model.total} />
          <Metric
            label={t('masterdata.product.metric.accessories')}
            value={model.summary.accessory_count}
          />
          <Metric
            label={t('masterdata.product.metric.withImage')}
            value={t('masterdata.product.metric.withImageValue', {
              count: model.summary.with_image_count,
            })}
          />
        </div>
      ) : null}

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
        addImageError={addImageError}
        error={formError}
        form={form}
        imageErrors={imageErrors}
        imageUploading={imageUploading}
        mode={productModalMode}
        setForm={setForm}
        submitting={productSubmitting}
        onAddImageFiles={(files) => {
          void addProductImages(files)
        }}
        onCancel={() => setProductModalMode(null)}
        onRemoveImage={removeProductImage}
        onReplaceImageFile={(index, file) => {
          void replaceProductImage(index, file)
        }}
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
