// 商品资料：新增/编辑商品弹窗

import { Input, InputNumber, Modal, Select } from 'antd'
import { ImagePlus } from 'lucide-react'
import type { ChangeEvent, FormEvent } from 'react'

import { t } from '@/app/appI18n'
import {
  accessoryRuleOptions,
  productStatusOptions,
  type ProductFormState,
} from '../productHelpers'

type Props = {
  mode: 'create' | 'edit' | null
  form: ProductFormState
  setForm: (form: ProductFormState) => void
  submitting: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  onImageFileChange: (event: ChangeEvent<HTMLInputElement>) => void
}

function rateToPercent(value: string): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Number((parsed * 100).toFixed(2)) : null
}

function percentToRate(value: number | null): string {
  return value === null ? '' : String(Number((value / 100).toFixed(4)))
}

export function ProductFormModal({
  mode,
  form,
  setForm,
  submitting,
  onSubmit,
  onCancel,
  onImageFileChange,
}: Props) {
  return (
    <Modal
      centered
      footer={null}
      open={Boolean(mode)}
      title={mode === 'edit' ? t('masterdata.product.edit') : t('masterdata.product.create')}
      width={1040}
      onCancel={onCancel}
    >
      <form className="record-form entity-modal-form" onSubmit={onSubmit}>
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
            <InputNumber
              addonAfter="%"
              max={100}
              min={0}
              precision={2}
              step={0.01}
              value={rateToPercent(form.tax_rate)}
              onChange={(value) => setForm({ ...form, tax_rate: percentToRate(value) })}
            />
            <span className="field-hint">{t('masterdata.product.rateHint')}</span>
          </label>
          <label>
            {t('masterdata.product.field.rebateRate')}
            <InputNumber
              addonAfter="%"
              max={100}
              min={0}
              precision={2}
              step={0.01}
              value={rateToPercent(form.rebate_rate)}
              onChange={(value) => setForm({ ...form, rebate_rate: percentToRate(value) })}
            />
            <span className="field-hint">{t('masterdata.product.rateHint')}</span>
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
                  onChange={onImageFileChange}
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
