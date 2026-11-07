import { Button, Input, Modal, Table } from 'antd'
import {
  ArrowLeft,
  LayoutDashboard,
  Plus,
  Search,
  CheckCircle2,
  Save,
  ShieldCheck,
} from 'lucide-react'
import { type VerificationDocument, type VerificationUsageItem } from '../../../../api'
import { FormSelect, PanelTitle } from '../../../../shared/ui'
import { t } from '../../../appI18n'
import {
  verificationDocumentStatusOptions,
  verificationReminderStatusOptions,
} from '../../../../shared/formOptions'
import { formatDate, formatFinanceAmount, nullableText } from '../../appHelpers'
import {
  initialTaxRefundForm,
  verificationDocumentStatusLabel,
  verificationDocumentStatusTag,
  verificationReminderStatusTag,
} from '../financeHelpers'
import type { TaxModel } from '../hooks/useTaxModule'
import type { FinanceViewShell } from '../financePageTypes'

type Props = {
  model: TaxModel
  shell: FinanceViewShell
}

export function TaxView({ model, shell }: Props) {
  const {
    customsReceiptForm,
    loadVerificationDocuments,
    loadVerificationUsage,
    loadingVerificationDocuments,
    loadingVerificationUsage,
    selectedVerificationCanRefund,
    selectedVerificationCanRegisterCustoms,
    selectedVerificationCanVerify,
    selectedVerificationDocument,
    setCustomsReceiptForm,
    setSelectedVerificationDocumentId,
    setTaxDocumentModalOpen,
    setTaxRefundForm,
    setVerificationDocumentForm,
    setVerificationOwnerFilter,
    setVerificationRegisterForm,
    setVerificationReminderFilter,
    setVerificationSearch,
    setVerificationShipmentFilter,
    setVerificationStatusFilter,
    setVerificationUsageReminderFilter,
    setVerificationUsageSearch,
    setVerificationUsageShipmentFilter,
    setVerificationUsageStatusFilter,
    submitCustomsReceipt,
    submitTaxRefund,
    submitVerificationDocument,
    submitVerificationRegister,
    submittingCustomsReceipt,
    submittingTaxRefund,
    submittingVerificationDocument,
    submittingVerificationRegister,
    taxDocumentModalOpen,
    taxRefundForm,
    verificationDocumentForm,
    verificationDocuments,
    verificationOwnerFilter,
    verificationRegisterForm,
    verificationReminderFilter,
    verificationSearch,
    verificationShipmentFilter,
    verificationStatusFilter,
    verificationUsage,
    verificationUsageReminderFilter,
    verificationUsageSearch,
    verificationUsageShipmentFilter,
    verificationUsageStatusFilter,
  } = model
  const { detailId, goModule, goDetail, moduleAlerts, moduleHeader } = shell

  return (
    <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
      {detailId ? (
        <div className="finance-subnav">
          <button className="finance-back-button" type="button" onClick={() => goModule('tax')}>
            <ArrowLeft size={16} />
            {t('finance.tax.title')}
          </button>
        </div>
      ) : (
        moduleHeader
      )}
      {moduleAlerts}
      <section
        className={detailId ? 'finance-detail-grid' : 'finance-tax-grid'}
        aria-label={t('finance.tax.title')}
      >
        {!detailId ? (
          <section className="workspace-panel finance-tax-list-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<ShieldCheck size={18} />}
                title={t('finance.tax.panel.documentList')}
              />
              <form
                aria-label={t('finance.tax.filter.formAria')}
                className="inline-filters single-line-filter-toolbar"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadVerificationDocuments()
                }}
              >
                <label>
                  {t('finance.tax.filter.documentSearch')}
                  <Input
                    value={verificationSearch}
                    onChange={(event) => setVerificationSearch(event.target.value)}
                  />
                </label>
                <label>
                  {t('finance.tax.filter.progressStatus')}
                  <FormSelect
                    value={verificationStatusFilter}
                    onChange={(event) => setVerificationStatusFilter(event.target.value)}
                  >
                    <option value="">{t('finance.tax.filter.allStatuses')}</option>
                    {verificationDocumentStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('finance.tax.filter.reminderStatus')}
                  <FormSelect
                    value={verificationReminderFilter}
                    onChange={(event) => setVerificationReminderFilter(event.target.value)}
                  >
                    <option value="">{t('finance.tax.filter.allReminders')}</option>
                    {verificationReminderStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('finance.tax.field.ownerUserId')}
                  <Input
                    value={verificationOwnerFilter}
                    onChange={(event) => setVerificationOwnerFilter(event.target.value)}
                  />
                </label>
                <label>
                  {t('finance.tax.field.shipmentNo')}
                  <Input
                    value={verificationShipmentFilter}
                    onChange={(event) => setVerificationShipmentFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('finance.tax.action.search')}
                </Button>
                <Button
                  type="primary"
                  icon={<Plus size={16} />}
                  onClick={() => setTaxDocumentModalOpen(true)}
                >
                  {t('finance.tax.action.issueDocument')}
                </Button>
              </form>
            </div>
            <Table<VerificationDocument>
              columns={[
                {
                  title: t('finance.tax.table.document'),
                  dataIndex: 'document_no',
                  render: (value: string) => (
                    <button className="row-button" type="button">
                      {value}
                    </button>
                  ),
                },
                {
                  title: t('finance.field.status'),
                  dataIndex: 'status',
                  render: verificationDocumentStatusTag,
                },
                {
                  title: t('finance.tax.table.reminder'),
                  dataIndex: 'reminder_status',
                  render: verificationReminderStatusTag,
                },
                {
                  title: t('finance.tax.table.shipment'),
                  dataIndex: 'shipment_no',
                  render: nullableText,
                },
                {
                  title: t('finance.tax.table.validUntil'),
                  dataIndex: 'valid_until',
                  render: formatDate,
                },
                {
                  title: t('finance.tax.table.refundable'),
                  dataIndex: 'refundable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.tax.table.refunded'),
                  dataIndex: 'refunded_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
              ]}
              dataSource={verificationDocuments}
              loading={loadingVerificationDocuments}
              pagination={false}
              rowClassName={(record) =>
                record.id === selectedVerificationDocument?.id ? 'selected-row' : ''
              }
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => {
                  setSelectedVerificationDocumentId(record.id)
                  setTaxRefundForm(initialTaxRefundForm(record.currency, record.unrefunded_amount))
                  goDetail('tax', record.id)
                },
              })}
            />
          </section>
        ) : null}

        {!detailId ? (
          <Modal
            centered
            footer={null}
            open={taxDocumentModalOpen}
            title={t('finance.tax.modal.issueTitle')}
            width={760}
            onCancel={() => setTaxDocumentModalOpen(false)}
          >
            <form
              className="record-form"
              onSubmit={async (e) => {
                const created = await submitVerificationDocument(e)
                if (created) setTaxDocumentModalOpen(false)
              }}
            >
              <div className="form-pair two">
                <label>
                  {t('finance.tax.field.documentNo')}
                  <Input
                    value={verificationDocumentForm.document_no}
                    onChange={(event) =>
                      setVerificationDocumentForm({
                        ...verificationDocumentForm,
                        document_no: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('finance.tax.field.receivedAt')}
                  <Input
                    type="date"
                    value={verificationDocumentForm.received_at}
                    onChange={(event) =>
                      setVerificationDocumentForm({
                        ...verificationDocumentForm,
                        received_at: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  {t('finance.tax.field.shipmentPlanId')}
                  <Input
                    value={verificationDocumentForm.shipment_plan_id}
                    onChange={(event) =>
                      setVerificationDocumentForm({
                        ...verificationDocumentForm,
                        shipment_plan_id: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('finance.tax.field.shipmentNo')}
                  <Input
                    value={verificationDocumentForm.shipment_no}
                    onChange={(event) =>
                      setVerificationDocumentForm({
                        ...verificationDocumentForm,
                        shipment_no: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  {t('finance.tax.field.ownerUserId')}
                  <Input
                    value={verificationDocumentForm.owner_user_id}
                    onChange={(event) =>
                      setVerificationDocumentForm({
                        ...verificationDocumentForm,
                        owner_user_id: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('finance.tax.field.ownerUserName')}
                  <Input
                    value={verificationDocumentForm.owner_user_name}
                    onChange={(event) =>
                      setVerificationDocumentForm({
                        ...verificationDocumentForm,
                        owner_user_name: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  {t('finance.tax.field.customerName')}
                  <Input
                    value={verificationDocumentForm.customer_name}
                    onChange={(event) =>
                      setVerificationDocumentForm({
                        ...verificationDocumentForm,
                        customer_name: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('finance.tax.field.validUntil')}
                  <Input
                    type="date"
                    value={verificationDocumentForm.valid_until}
                    onChange={(event) =>
                      setVerificationDocumentForm({
                        ...verificationDocumentForm,
                        valid_until: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  {t('finance.tax.field.refundableAmount')}
                  <Input
                    value={verificationDocumentForm.refundable_amount}
                    onChange={(event) =>
                      setVerificationDocumentForm({
                        ...verificationDocumentForm,
                        refundable_amount: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('finance.field.currency')}
                  <Input
                    value={verificationDocumentForm.currency}
                    onChange={(event) =>
                      setVerificationDocumentForm({
                        ...verificationDocumentForm,
                        currency: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <label>
                {t('finance.tax.field.remark')}
                <Input
                  value={verificationDocumentForm.remark}
                  onChange={(event) =>
                    setVerificationDocumentForm({
                      ...verificationDocumentForm,
                      remark: event.target.value,
                    })
                  }
                />
              </label>
              <div className="modal-actions">
                <button
                  className="secondary-inline"
                  type="button"
                  onClick={() => setTaxDocumentModalOpen(false)}
                >
                  {t('finance.tax.action.cancel')}
                </button>
                <button
                  className="inline-submit"
                  disabled={submittingVerificationDocument}
                  type="submit"
                >
                  {t('finance.tax.action.issueDocument')}
                </button>
              </div>
            </form>
          </Modal>
        ) : null}

        {detailId ? (
          <section className="workspace-panel finance-tax-process-panel">
            <PanelTitle icon={<CheckCircle2 size={18} />} title={t('finance.tax.panel.process')} />
            {selectedVerificationDocument ? (
              <dl className="detail-list finance-tax-detail-list">
                <div>
                  <dt>{t('finance.tax.field.currentDocument')}</dt>
                  <dd>{selectedVerificationDocument.document_no}</dd>
                </div>
                <div>
                  <dt>{t('finance.field.status')}</dt>
                  <dd>{verificationDocumentStatusLabel(selectedVerificationDocument.status)}</dd>
                </div>
                <div>
                  <dt>{t('finance.tax.field.unrefunded')}</dt>
                  <dd>
                    {formatFinanceAmount(
                      selectedVerificationDocument.unrefunded_amount,
                      selectedVerificationDocument.currency,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>{t('finance.tax.field.reminderDate')}</dt>
                  <dd>{formatDate(selectedVerificationDocument.reminder_date)}</dd>
                </div>
              </dl>
            ) : (
              <div className="module-state">{t('finance.tax.message.noDocument')}</div>
            )}
            <div className="finance-tax-actions">
              <form className="record-form compact-section" onSubmit={submitCustomsReceipt}>
                <div className="form-divider">{t('finance.tax.panel.customsReceiptForm')}</div>
                <div className="form-pair two">
                  <label>
                    {t('finance.tax.field.customsDeclarationNo')}
                    <Input
                      value={customsReceiptForm.customs_declaration_no}
                      onChange={(event) =>
                        setCustomsReceiptForm({
                          ...customsReceiptForm,
                          customs_declaration_no: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    {t('finance.tax.field.customsReceiptNo')}
                    <Input
                      value={customsReceiptForm.customs_receipt_no}
                      onChange={(event) =>
                        setCustomsReceiptForm({
                          ...customsReceiptForm,
                          customs_receipt_no: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <div className="form-pair two">
                  <label>
                    {t('finance.tax.field.receiptDate')}
                    <Input
                      type="date"
                      value={customsReceiptForm.received_at}
                      onChange={(event) =>
                        setCustomsReceiptForm({
                          ...customsReceiptForm,
                          received_at: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    {t('finance.tax.field.receiptRemark')}
                    <Input
                      value={customsReceiptForm.remark}
                      onChange={(event) =>
                        setCustomsReceiptForm({
                          ...customsReceiptForm,
                          remark: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <Button
                  htmlType="submit"
                  icon={<Save size={16} />}
                  loading={submittingCustomsReceipt}
                  disabled={!selectedVerificationCanRegisterCustoms}
                >
                  {t('finance.tax.action.registerReceipt')}
                </Button>
              </form>

              <form className="record-form compact-section" onSubmit={submitVerificationRegister}>
                <div className="form-divider">{t('finance.tax.panel.verificationForm')}</div>
                <div className="form-pair two">
                  <label>
                    {t('finance.tax.field.verificationNo')}
                    <Input
                      value={verificationRegisterForm.verification_no}
                      onChange={(event) =>
                        setVerificationRegisterForm({
                          ...verificationRegisterForm,
                          verification_no: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    {t('finance.tax.field.verifiedAt')}
                    <Input
                      type="date"
                      value={verificationRegisterForm.verified_at}
                      onChange={(event) =>
                        setVerificationRegisterForm({
                          ...verificationRegisterForm,
                          verified_at: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <label>
                  {t('finance.tax.field.verificationRemark')}
                  <Input
                    value={verificationRegisterForm.remark}
                    onChange={(event) =>
                      setVerificationRegisterForm({
                        ...verificationRegisterForm,
                        remark: event.target.value,
                      })
                    }
                  />
                </label>
                <Button
                  htmlType="submit"
                  icon={<CheckCircle2 size={16} />}
                  loading={submittingVerificationRegister}
                  disabled={!selectedVerificationCanVerify}
                >
                  {t('finance.tax.action.registerVerification')}
                </Button>
              </form>

              <form className="record-form compact-section" onSubmit={submitTaxRefund}>
                <div className="form-divider">{t('finance.tax.panel.refundForm')}</div>
                <div className="form-pair two">
                  <label>
                    {t('finance.tax.field.refundNo')}
                    <Input
                      value={taxRefundForm.refund_no}
                      onChange={(event) =>
                        setTaxRefundForm({ ...taxRefundForm, refund_no: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    {t('finance.tax.field.refundedAt')}
                    <Input
                      type="date"
                      value={taxRefundForm.refunded_at}
                      onChange={(event) =>
                        setTaxRefundForm({ ...taxRefundForm, refunded_at: event.target.value })
                      }
                    />
                  </label>
                </div>
                <div className="form-pair three">
                  <label>
                    {t('finance.tax.field.refundAmount')}
                    <Input
                      value={taxRefundForm.amount}
                      onChange={(event) =>
                        setTaxRefundForm({ ...taxRefundForm, amount: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    {t('finance.field.currency')}
                    <Input
                      value={taxRefundForm.currency}
                      onChange={(event) =>
                        setTaxRefundForm({ ...taxRefundForm, currency: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    {t('finance.tax.field.bankReceiptNo')}
                    <Input
                      value={taxRefundForm.bank_receipt_no}
                      onChange={(event) =>
                        setTaxRefundForm({
                          ...taxRefundForm,
                          bank_receipt_no: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <label>
                  {t('finance.tax.field.refundRemark')}
                  <Input
                    value={taxRefundForm.remark}
                    onChange={(event) =>
                      setTaxRefundForm({ ...taxRefundForm, remark: event.target.value })
                    }
                  />
                </label>
                <Button
                  htmlType="submit"
                  icon={<Save size={16} />}
                  loading={submittingTaxRefund}
                  disabled={!selectedVerificationCanRefund}
                >
                  {t('finance.tax.action.registerRefund')}
                </Button>
              </form>
            </div>
          </section>
        ) : null}

        {!detailId ? (
          <section className="workspace-panel finance-tax-usage-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<LayoutDashboard size={18} />}
                title={t('finance.tax.panel.usage')}
              />
              <form
                className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadVerificationUsage()
                }}
              >
                <label>
                  {t('finance.tax.filter.usageSearch')}
                  <Input
                    value={verificationUsageSearch}
                    onChange={(event) => setVerificationUsageSearch(event.target.value)}
                  />
                </label>
                <label>
                  {t('finance.tax.filter.progressStatus')}
                  <FormSelect
                    value={verificationUsageStatusFilter}
                    onChange={(event) => setVerificationUsageStatusFilter(event.target.value)}
                  >
                    <option value="">{t('finance.tax.filter.allStatuses')}</option>
                    {verificationDocumentStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('finance.tax.filter.reminderStatus')}
                  <FormSelect
                    value={verificationUsageReminderFilter}
                    onChange={(event) => setVerificationUsageReminderFilter(event.target.value)}
                  >
                    <option value="">{t('finance.tax.filter.allReminders')}</option>
                    {verificationReminderStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('finance.tax.field.shipmentNo')}
                  <Input
                    value={verificationUsageShipmentFilter}
                    onChange={(event) => setVerificationUsageShipmentFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('finance.tax.action.search')}
                </Button>
              </form>
            </div>
            <Table<VerificationUsageItem>
              columns={[
                {
                  title: t('finance.tax.table.document'),
                  dataIndex: 'document_no',
                  render: (value: string) => <strong>{value}</strong>,
                },
                {
                  title: t('finance.tax.table.shipment'),
                  dataIndex: 'shipment_no',
                  render: nullableText,
                },
                {
                  title: t('finance.tax.table.salesUser'),
                  dataIndex: 'owner_user_name',
                  render: nullableText,
                },
                {
                  title: t('finance.field.status'),
                  dataIndex: 'status',
                  render: verificationDocumentStatusTag,
                },
                {
                  title: t('finance.tax.table.reminder'),
                  dataIndex: 'reminder_status',
                  render: verificationReminderStatusTag,
                },
                {
                  title: t('finance.tax.table.refundable'),
                  dataIndex: 'refundable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.tax.table.refunded'),
                  dataIndex: 'refunded_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.tax.field.customsReceiptNo'),
                  dataIndex: 'customs_receipt_no',
                  render: nullableText,
                },
                {
                  title: t('finance.tax.field.verificationNo'),
                  dataIndex: 'verification_no',
                  render: nullableText,
                },
              ]}
              dataSource={verificationUsage}
              loading={loadingVerificationUsage}
              pagination={false}
              rowKey="verification_document_id"
              size="small"
            />
          </section>
        ) : null}
      </section>
    </section>
  )
}
