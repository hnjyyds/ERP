import { Button, Input, Modal } from 'antd'

import { t } from '@/app/appI18n'

import type { usePurchaseInquiryWorkflow } from '../hooks/usePurchaseInquiryWorkflow'

type Props = {
  workflow: ReturnType<typeof usePurchaseInquiryWorkflow>
}

export function PurchaseQuotationModal({ workflow }: Props) {
  const form = workflow.quotationForm
  const setForm = workflow.setQuotationForm

  return (
    <Modal
      centered
      footer={null}
      open={workflow.actionModal === 'quotation'}
      title={t('purchase.inquiry.action.addQuotation')}
      width={880}
      onCancel={() => workflow.setActionModal(null)}
    >
      <div className="workflow-modal-content entity-modal-form">
        <form className="record-form accessory-form" onSubmit={workflow.addSupplierQuotation}>
          <div className="form-divider">{t('purchase.inquiry.form.quotationSection')}</div>
          <div className="form-pair two">
            <label>
              {t('purchase.inquiry.field.supplierId')}
              <Input
                value={form.supplier_id}
                onChange={(event) => setForm({ ...form, supplier_id: event.target.value })}
              />
            </label>
            <label>
              {t('purchase.inquiry.field.supplierName')}
              <Input
                value={form.supplier_name}
                onChange={(event) => setForm({ ...form, supplier_name: event.target.value })}
              />
            </label>
          </div>
          <div className="form-pair three">
            <label>
              {t('purchase.inquiry.field.quotedAt')}
              <Input
                type="date"
                value={form.quoted_at}
                onChange={(event) => setForm({ ...form, quoted_at: event.target.value })}
              />
            </label>
            <label>
              {t('purchase.inquiry.field.unitPrice')}
              <Input
                type="number"
                min="0.0001"
                step="0.0001"
                value={form.unit_price}
                onChange={(event) => setForm({ ...form, unit_price: event.target.value })}
              />
            </label>
            <label>
              {t('purchase.inquiry.field.currency')}
              <Input
                value={form.currency}
                onChange={(event) => setForm({ ...form, currency: event.target.value })}
              />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              {t('purchase.inquiry.field.leadTimeDays')}
              <Input
                type="number"
                min="0"
                step="1"
                value={form.lead_time_days}
                onChange={(event) => setForm({ ...form, lead_time_days: event.target.value })}
              />
            </label>
            <label>
              {t('purchase.inquiry.field.minOrderQuantity')}
              <Input
                type="number"
                min="0"
                step="0.0001"
                value={form.min_order_quantity}
                onChange={(event) => setForm({ ...form, min_order_quantity: event.target.value })}
              />
            </label>
          </div>
          <label className="checkbox-label">
            <input
              aria-label={t('purchase.inquiry.field.sampleAvailable')}
              checked={form.sample_available}
              type="checkbox"
              onChange={(event) => setForm({ ...form, sample_available: event.target.checked })}
            />
            {t('purchase.inquiry.field.sampleAvailable')}
          </label>
          <label>
            {t('purchase.inquiry.field.quotationRemark')}
            <Input
              value={form.remark}
              onChange={(event) => setForm({ ...form, remark: event.target.value })}
            />
          </label>
          <Button htmlType="submit" loading={workflow.submitting} type="primary">
            {t('purchase.inquiry.action.addQuotation')}
          </Button>
        </form>
      </div>
    </Modal>
  )
}
