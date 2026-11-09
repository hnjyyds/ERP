// 商品资料：配件新增/编辑弹窗

import { Input, Modal, Select } from 'antd'
import type { FormEvent } from 'react'

import { t } from '@/app/appI18n'
import { accessoryRuleOptions, type ProductAccessoryFormState } from '../productHelpers'

type Props = {
  mode: 'create' | 'edit' | null
  form: ProductAccessoryFormState
  setForm: (form: ProductAccessoryFormState) => void
  submitting: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function ProductAccessoryModal({
  mode,
  form,
  setForm,
  submitting,
  onSubmit,
  onCancel,
}: Props) {
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
              value={form.unit_consumption}
              onChange={(event) => setForm({ ...form, unit_consumption: event.target.value })}
            />
          </label>
          <label>
            {t('masterdata.product.field.unit')}
            <Input
              value={form.unit}
              onChange={(event) => setForm({ ...form, unit: event.target.value })}
            />
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
