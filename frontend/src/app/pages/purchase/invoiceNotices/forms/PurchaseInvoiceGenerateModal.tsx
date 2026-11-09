// 开票通知：从报关单证生成开票通知的弹窗与行项目字段

import { Button, Input, Modal } from 'antd'
import { LayoutDashboard } from 'lucide-react'

import { t } from '@/app/appI18n'
import { PanelTitle } from '@/shared/ui'
import type { PurchaseInvoiceNoticeFormState } from '../invoiceNoticeHelpers'
import type { PurchaseInvoiceNoticesModel } from '../hooks/usePurchaseInvoiceNotices'

type Props = {
  model: PurchaseInvoiceNoticesModel
}

export function PurchaseInvoiceGenerateModal({ model }: Props) {
  const {
    invoiceModalOpen,
    invoiceSubmitting,
    form,
    setForm,
    customsDeclarationNoError,
    setCustomsDeclarationNoError,
    closeGenerateModal,
    generateFromCustoms,
  } = model

  return (
    <Modal
      centered
      footer={null}
      open={invoiceModalOpen}
      title={t('purchase.invoiceNotice.form.generateTitle')}
      width={1040}
      onCancel={closeGenerateModal}
    >
      <div className="workflow-modal-content entity-modal-form">
        <PanelTitle
          icon={<LayoutDashboard size={18} />}
          title={t('purchase.invoiceNotice.form.generateFromCustoms')}
        />
        <form className="record-form" onSubmit={generateFromCustoms}>
          <div className="form-pair two">
            <label htmlFor="purchase-invoice-customs-id">
              {t('purchase.invoiceNotice.field.customsDeclarationId')}
              <Input
                id="purchase-invoice-customs-id"
                value={form.customs_declaration_id}
                onChange={(event) =>
                  setForm({ ...form, customs_declaration_id: event.target.value })
                }
              />
            </label>
            <label htmlFor="purchase-invoice-customs-no">
              {t('purchase.invoiceNotice.field.customsDeclarationNo')}
              <Input
                id="purchase-invoice-customs-no"
                required
                aria-invalid={Boolean(customsDeclarationNoError)}
                aria-describedby="purchase-invoice-customs-no-error"
                value={form.customs_declaration_no}
                onChange={(event) => {
                  setCustomsDeclarationNoError('')
                  setForm({ ...form, customs_declaration_no: event.target.value })
                }}
              />
              {customsDeclarationNoError ? (
                <span className="form-field-error" id="purchase-invoice-customs-no-error">
                  {customsDeclarationNoError}
                </span>
              ) : null}
            </label>
          </div>
          <div className="form-pair three">
            <label htmlFor="purchase-invoice-declaration-date">
              {t('purchase.invoiceNotice.field.declarationDate')}
              <Input
                id="purchase-invoice-declaration-date"
                required
                type="date"
                value={form.declaration_date}
                onChange={(event) => setForm({ ...form, declaration_date: event.target.value })}
              />
            </label>
            <label htmlFor="purchase-invoice-notice-date">
              {t('purchase.invoiceNotice.field.noticeDate')}
              <Input
                id="purchase-invoice-notice-date"
                required
                type="date"
                value={form.notice_date}
                onChange={(event) => setForm({ ...form, notice_date: event.target.value })}
              />
            </label>
            <label htmlFor="purchase-invoice-currency">
              {t('purchase.invoiceNotice.field.currency')}
              <Input
                id="purchase-invoice-currency"
                required
                value={form.currency}
                onChange={(event) => setForm({ ...form, currency: event.target.value })}
              />
            </label>
          </div>
          <label htmlFor="purchase-invoice-remarks">
            {t('purchase.invoiceNotice.field.generateRemarks')}
            <Input
              id="purchase-invoice-remarks"
              value={form.remarks}
              onChange={(event) => setForm({ ...form, remarks: event.target.value })}
            />
          </label>

          <PurchaseInvoiceLineFields
            form={form}
            lineKey="a"
            required
            setForm={setForm}
            title={t('purchase.invoiceNotice.form.supplierSectionA')}
          />
          <PurchaseInvoiceLineFields
            form={form}
            lineKey="b"
            setForm={setForm}
            title={t('purchase.invoiceNotice.form.supplierSectionB')}
          />

          <Button htmlType="submit" loading={invoiceSubmitting} type="primary">
            {t('purchase.invoiceNotice.action.generate')}
          </Button>
        </form>
      </div>
    </Modal>
  )
}

function PurchaseInvoiceLineFields({
  form,
  lineKey,
  required = false,
  setForm,
  title,
}: {
  form: PurchaseInvoiceNoticeFormState
  lineKey: 'a' | 'b'
  required?: boolean
  setForm: (form: PurchaseInvoiceNoticeFormState) => void
  title: string
}) {
  const suffix = lineKey
  const values = {
    supplier_id: form[`supplier_id_${suffix}`],
    supplier_name: form[`supplier_name_${suffix}`],
    purchase_contract_id: form[`purchase_contract_id_${suffix}`],
    purchase_contract_no: form[`purchase_contract_no_${suffix}`],
    product_id: form[`product_id_${suffix}`],
    product_code: form[`product_code_${suffix}`],
    product_name: form[`product_name_${suffix}`],
    customs_name: form[`customs_name_${suffix}`],
    invoice_name: form[`invoice_name_${suffix}`],
    quantity: form[`quantity_${suffix}`],
    unit: form[`unit_${suffix}`],
    amount: form[`amount_${suffix}`],
    remark: form[`remark_${suffix}`],
  }

  function update(field: keyof typeof values, value: string) {
    setForm({
      ...form,
      [`${field}_${suffix}`]: value,
    } as PurchaseInvoiceNoticeFormState)
  }

  return (
    <>
      <div className="form-divider">{title}</div>
      <div className="form-pair two">
        <label htmlFor={`purchase-invoice-supplier-id-${suffix}`}>
          {t('purchase.invoiceNotice.field.supplierId')}
          <Input
            id={`purchase-invoice-supplier-id-${suffix}`}
            value={values.supplier_id}
            onChange={(event) => update('supplier_id', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-supplier-name-${suffix}`}>
          {t('purchase.invoiceNotice.field.supplier')}
          <Input
            id={`purchase-invoice-supplier-name-${suffix}`}
            required={required}
            value={values.supplier_name}
            onChange={(event) => update('supplier_name', event.target.value)}
          />
        </label>
      </div>
      <div className="form-pair two">
        <label htmlFor={`purchase-invoice-contract-no-${suffix}`}>
          {t('purchase.invoiceNotice.field.purchaseContractNo')}
          <Input
            id={`purchase-invoice-contract-no-${suffix}`}
            value={values.purchase_contract_no}
            onChange={(event) => update('purchase_contract_no', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-product-code-${suffix}`}>
          {t('purchase.invoiceNotice.field.productCode')}
          <Input
            id={`purchase-invoice-product-code-${suffix}`}
            value={values.product_code}
            onChange={(event) => update('product_code', event.target.value)}
          />
        </label>
      </div>
      <div className="visually-hidden">
        <label htmlFor={`purchase-invoice-contract-id-${suffix}`}>
          {t('purchase.invoiceNotice.field.purchaseContractId')}
          <Input
            id={`purchase-invoice-contract-id-${suffix}`}
            value={values.purchase_contract_id}
            onChange={(event) => update('purchase_contract_id', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-product-id-${suffix}`}>
          {t('purchase.invoiceNotice.field.productId')}
          <Input
            id={`purchase-invoice-product-id-${suffix}`}
            value={values.product_id}
            onChange={(event) => update('product_id', event.target.value)}
          />
        </label>
      </div>
      <div className="form-pair three">
        <label htmlFor={`purchase-invoice-product-name-${suffix}`}>
          {t('purchase.invoiceNotice.field.productName')}
          <Input
            id={`purchase-invoice-product-name-${suffix}`}
            required={required}
            value={values.product_name}
            onChange={(event) => update('product_name', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-customs-name-${suffix}`}>
          {t('purchase.invoiceNotice.field.customsName')}
          <Input
            id={`purchase-invoice-customs-name-${suffix}`}
            required={required}
            value={values.customs_name}
            onChange={(event) => update('customs_name', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-name-${suffix}`}>
          {t('purchase.invoiceNotice.field.invoiceName')}
          <Input
            id={`purchase-invoice-name-${suffix}`}
            required={required}
            value={values.invoice_name}
            onChange={(event) => update('invoice_name', event.target.value)}
          />
        </label>
      </div>
      <div className="form-pair three">
        <label htmlFor={`purchase-invoice-quantity-${suffix}`}>
          {t('purchase.invoiceNotice.field.invoiceQuantity')}
          <Input
            id={`purchase-invoice-quantity-${suffix}`}
            min="0.0001"
            required={required}
            step="0.0001"
            type="number"
            value={values.quantity}
            onChange={(event) => update('quantity', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-unit-${suffix}`}>
          {t('purchase.invoiceNotice.field.unit')}
          <Input
            id={`purchase-invoice-unit-${suffix}`}
            required={required}
            value={values.unit}
            onChange={(event) => update('unit', event.target.value)}
          />
        </label>
        <label htmlFor={`purchase-invoice-amount-${suffix}`}>
          {t('purchase.invoiceNotice.field.amount')}
          <Input
            id={`purchase-invoice-amount-${suffix}`}
            min="0"
            step="0.01"
            type="number"
            value={values.amount}
            onChange={(event) => update('amount', event.target.value)}
          />
        </label>
      </div>
      <label htmlFor={`purchase-invoice-remark-${suffix}`}>
        {t('purchase.invoiceNotice.field.lineRemarks')}
        <Input
          id={`purchase-invoice-remark-${suffix}`}
          value={values.remark}
          onChange={(event) => update('remark', event.target.value)}
        />
      </label>
    </>
  )
}
