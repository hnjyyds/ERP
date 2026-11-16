// 商品资料：新增/编辑商品弹窗

import { Input, InputNumber, Modal, Select } from 'antd'
import { ImagePlus, X } from 'lucide-react'
import { useEffect, useRef, type FormEvent } from 'react'

import { t } from '@/app/appI18n'
import {
  accessoryRuleOptions,
  productStatusOptions,
  type ProductFormError,
  type ProductFormState,
} from '../productHelpers'

type Props = {
  mode: 'create' | 'edit' | null
  form: ProductFormState
  setForm: (form: ProductFormState) => void
  submitting: boolean
  error: ProductFormError | null
  imageErrors: Record<number, string>
  addImageError: string
  imageUploading: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  onAddImageFiles: (files: File[]) => void
  onReplaceImageFile: (index: number, file: File) => void
  onRemoveImage: (index: number) => void
}

function rateToPercent(value: string): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Number((parsed * 100).toFixed(2)) : null
}

function percentToRate(value: number | null): string {
  return value === null ? '' : String(Number((value / 100).toFixed(4)))
}

// 弹窗可能是 form、ant-modal-body 或 ant-modal-wrap 在滚动，
// 三处一起复位，重新打开时编号、名称等首行字段必须可见。
function resetModalScroll(form: HTMLFormElement | null) {
  if (!form) return
  form.scrollTop = 0
  const body = form.closest('.ant-modal-body')
  const wrap = form.closest('.ant-modal-wrap')
  if (body instanceof HTMLElement) body.scrollTop = 0
  if (wrap instanceof HTMLElement) wrap.scrollTop = 0
}

export function ProductFormModal({
  mode,
  form,
  setForm,
  submitting,
  error,
  imageErrors,
  addImageError,
  imageUploading,
  onSubmit,
  onCancel,
  onAddImageFiles,
  onReplaceImageFile,
  onRemoveImage,
}: Props) {
  // 用户补填对应字段后立即收起该字段的错误，不必再次提交才消失。
  const activeError = error && !form[error.field].trim() ? error : null

  // 表单自身是滚动容器；关闭后再次打开必须回到顶部，
  // 否则会沿用上次的滚动位置，把编号、名称等首行字段藏在标题下。
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!mode) return
    resetModalScroll(formRef.current)
    // 打开动画与自动聚焦可能再次滚动容器，下一帧再复位一次。
    const frame = requestAnimationFrame(() => resetModalScroll(formRef.current))
    return () => cancelAnimationFrame(frame)
  }, [mode])

  useEffect(() => {
    if (!activeError) return
    document.getElementById(`product-field-${activeError.field}`)?.focus()
  }, [activeError])

  const fieldError = (field: ProductFormError['field']) =>
    activeError?.field === field ? (
      <span className="form-field-error" id={`product-field-${field}-error`}>
        {activeError.message}
      </span>
    ) : null

  const invalid = (field: ProductFormError['field']) => ({
    'aria-invalid': activeError?.field === field,
    'aria-describedby': activeError?.field === field ? `product-field-${field}-error` : undefined,
  })

  return (
    <Modal
      centered
      destroyOnHidden
      footer={null}
      open={Boolean(mode)}
      title={mode === 'edit' ? t('masterdata.product.edit') : t('masterdata.product.create')}
      width={1040}
      afterOpenChange={(open) => {
        // 打开动画结束后再复位一次，避免弹窗恢复焦点时带回旧滚动位置。
        if (!open) return
        requestAnimationFrame(() => resetModalScroll(formRef.current))
      }}
      onCancel={onCancel}
    >
      <form className="record-form entity-modal-form" ref={formRef} onSubmit={onSubmit}>
        <div className="entity-modal-grid">
          <label>
            <span className="form-field-label">
              {t('masterdata.product.field.productCode')}
              <span className="form-required-mark">*</span>
            </span>
            <Input
              id="product-field-code"
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
              {...invalid('code')}
            />
            {fieldError('code')}
          </label>
          <label>
            <span className="form-field-label">
              {t('masterdata.product.field.productUnit')}
              <span className="form-required-mark">*</span>
            </span>
            <Input
              id="product-field-unit"
              value={form.unit}
              onChange={(event) => setForm({ ...form, unit: event.target.value })}
              {...invalid('unit')}
            />
            {fieldError('unit')}
          </label>
          <label>
            <span className="form-field-label">
              {t('masterdata.product.field.cnName')}
              <span className="form-required-mark">*</span>
            </span>
            <Input
              id="product-field-cn_name"
              value={form.cn_name}
              onChange={(event) => setForm({ ...form, cn_name: event.target.value })}
              {...invalid('cn_name')}
            />
            {fieldError('cn_name')}
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
            <span className="form-field-label">
              {t('masterdata.product.field.customsCode')}
              <span className="form-required-mark">*</span>
            </span>
            <Input
              id="product-field-customs_code"
              value={form.customs_code}
              onChange={(event) => setForm({ ...form, customs_code: event.target.value })}
              {...invalid('customs_code')}
            />
            {fieldError('customs_code')}
          </label>
          <label className="product-rate-field">
            {t('masterdata.product.field.taxRate')}
            <InputNumber
              className="product-rate-input"
              suffix="%"
              max={100}
              min={0}
              precision={2}
              step={0.01}
              value={rateToPercent(form.tax_rate)}
              onChange={(value) => setForm({ ...form, tax_rate: percentToRate(value) })}
            />
            <span className="field-hint">{t('masterdata.product.rateHint')}</span>
          </label>
          <label className="product-rate-field">
            {t('masterdata.product.field.rebateRate')}
            <InputNumber
              className="product-rate-input"
              suffix="%"
              max={100}
              min={0}
              precision={2}
              step={0.01}
              value={rateToPercent(form.rebate_rate)}
              onChange={(value) => setForm({ ...form, rebate_rate: percentToRate(value) })}
            />
            <span className="field-hint">{t('masterdata.product.rateHint')}</span>
          </label>
          <label>
            {t('masterdata.product.field.status')}
            <Select
              options={productStatusOptions()}
              value={form.status}
              onChange={(value) => setForm({ ...form, status: value })}
            />
          </label>
          <div className="entity-modal-span product-image-field">
            <span className="product-image-field-label">
              {t('masterdata.product.field.image')}
              <span className="product-image-count">
                {t('masterdata.product.imageCount', { count: form.images.length })}
              </span>
            </span>
            <div className="product-image-grid">
              {form.images.map((url, index) => (
                <div className="product-image-item" key={`${url}-${index}`}>
                  <label className="product-image-thumb" title={t('masterdata.product.changeImage')}>
                    <input
                      accept="image/*"
                      aria-label={t('masterdata.product.changeImageAria')}
                      className="product-image-file-input"
                      disabled={imageUploading}
                      type="file"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        event.target.value = ''
                        if (file) onReplaceImageFile(index, file)
                      }}
                    />
                    <img src={url} alt={t('masterdata.product.imagePreviewAlt')} />
                    <span className="product-image-thumb-mask">
                      {imageUploading
                        ? t('masterdata.product.imageUploading')
                        : t('masterdata.product.changeImage')}
                    </span>
                  </label>
                  {index === 0 ? (
                    <span className="product-image-primary">
                      {t('masterdata.product.primaryImage')}
                    </span>
                  ) : null}
                  <button
                    aria-label={t('masterdata.product.removeImage')}
                    className="product-image-delete"
                    title={t('masterdata.product.removeImage')}
                    type="button"
                    onClick={() => onRemoveImage(index)}
                  >
                    <X size={13} />
                  </button>
                  {imageErrors[index] ? (
                    <span className="form-field-error">{imageErrors[index]}</span>
                  ) : null}
                </div>
              ))}
              <label className="product-image-add" title={t('masterdata.product.addImage')}>
                <input
                  accept="image/*"
                  aria-label={t('masterdata.product.addImage')}
                  className="product-image-file-input"
                  disabled={imageUploading}
                  multiple
                  type="file"
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? [])
                    event.target.value = ''
                    if (files.length > 0) onAddImageFiles(files)
                  }}
                />
                <ImagePlus size={20} />
                <span>{t('masterdata.product.addImage')}</span>
              </label>
            </div>
            {addImageError ? <span className="form-field-error">{addImageError}</span> : null}
            <p className="product-image-hint">{t('masterdata.product.imageHint')}</p>
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

        {mode === 'create' ? (
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
          <button className="secondary-inline" type="button" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button className="inline-submit" disabled={submitting} type="submit">
            {mode === 'edit' ? t('masterdata.product.save') : t('masterdata.product.create')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
