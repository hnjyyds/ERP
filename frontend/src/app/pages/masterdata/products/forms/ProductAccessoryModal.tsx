// 商品资料：配件新增/编辑弹窗

import { Input, Modal, Select } from 'antd'
import { useEffect, type FormEvent } from 'react'

import { t } from '@/app/appI18n'
import {
  accessoryRuleOptions,
  type ProductAccessoryFormError,
  type ProductAccessoryFormState,
} from '../productHelpers'

type Props = {
  mode: 'create' | 'edit' | null
  form: ProductAccessoryFormState
  setForm: (form: ProductAccessoryFormState) => void
  submitting: boolean
  error: ProductAccessoryFormError | null
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function ProductAccessoryModal({
  mode,
  form,
  setForm,
  submitting,
  error,
  onSubmit,
  onCancel,
}: Props) {
  // 用户补填对应字段后立即收起该字段的错误，不必再次提交才消失。
  const activeError = error && !form[error.field].trim() ? error : null

  useEffect(() => {
    if (!activeError) return
    document.getElementById(`product-accessory-field-${activeError.field}`)?.focus()
  }, [activeError])

  const fieldError = (field: ProductAccessoryFormError['field']) =>
    activeError?.field === field ? (
      <span className="form-field-error" id={`product-accessory-field-${field}-error`}>
        {activeError.message}
      </span>
    ) : null

  const invalid = (field: ProductAccessoryFormError['field']) => ({
    'aria-invalid': activeError?.field === field,
    'aria-describedby':
      activeError?.field === field ? `product-accessory-field-${field}-error` : undefined,
  })

  return (
    <Modal
      centered
      footer={null}
      open={Boolean(mode)}
      title={
        mode === 'edit'
          ? t('masterdata.product.accessory.edit')
          : t('masterdata.product.accessory.add')
      }
      width={720}
      onCancel={onCancel}
    >
      <form className="record-form entity-modal-form" onSubmit={onSubmit}>
        <div className="entity-modal-grid two">
          <label>
            <span className="form-field-label">
              {t('masterdata.product.field.accessoryName')}
              <span className="form-required-mark">*</span>
            </span>
            <Input
              id="product-accessory-field-accessory_name"
              value={form.accessory_name}
              onChange={(event) => setForm({ ...form, accessory_name: event.target.value })}
              {...invalid('accessory_name')}
            />
            {fieldError('accessory_name')}
          </label>
          <label>
            <span className="form-field-label">
              {t('masterdata.product.field.unitConsumption')}
              <span className="form-required-mark">*</span>
            </span>
            <Input
              id="product-accessory-field-unit_consumption"
              type="number"
              min="0"
              step="0.01"
              value={form.unit_consumption}
              onChange={(event) => setForm({ ...form, unit_consumption: event.target.value })}
              {...invalid('unit_consumption')}
            />
            {fieldError('unit_consumption')}
          </label>
          <label>
            <span className="form-field-label">
              {t('masterdata.product.field.unit')}
              <span className="form-required-mark">*</span>
            </span>
            <Input
              id="product-accessory-field-unit"
              value={form.unit}
              onChange={(event) => setForm({ ...form, unit: event.target.value })}
              {...invalid('unit')}
            />
            {fieldError('unit')}
          </label>
          <label>
            {t('masterdata.product.field.defaultSupplier')}
            <Input
              value={form.supplier}
              onChange={(event) => setForm({ ...form, supplier: event.target.value })}
            />
          </label>
          <label className="entity-modal-span">
            {t('masterdata.product.field.purchaseSplit')}
            <Select
              options={accessoryRuleOptions()}
              value={form.rule}
              onChange={(value) => setForm({ ...form, rule: value })}
            />
          </label>
        </div>
        <div className="modal-actions">
          <button className="secondary-inline" type="button" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button className="inline-submit" disabled={submitting} type="submit">
            {mode === 'edit'
              ? t('masterdata.product.accessory.save')
              : t('masterdata.product.accessory.add')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
