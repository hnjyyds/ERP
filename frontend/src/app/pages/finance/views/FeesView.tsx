import { Alert, Button, Input, Modal, Table } from 'antd'
import { ArrowLeft, Plus, Search, CheckCircle2, Save, ShieldCheck, Wallet } from 'lucide-react'
import {
  type FeePayableItem,
  type FeePaymentRequest,
  type PartnerFeeInvoice,
} from '../../../../api'
import { FormSelect, PanelTitle } from '../../../../shared/ui'
import {
  partnerFeeInvoiceStatusOptions,
  feeTypeOptions,
  partnerTypeOptions,
} from '../../../../shared/formOptions'
import { t } from '../../../appI18n'
import { formatFinanceAmount, nullableText } from '../../appHelpers'
import {
  initialFeePaymentRequestForm,
  initialFeePaymentApprovalForm,
  partnerFeeInvoiceStatusTag,
  feePaymentRequestStatusTag,
  feeTypeLabel,
} from '../financeHelpers'
import { ApprovalAssigneeSelect } from '../../../components/ApprovalAssigneeSelect'
import type { FeesModel } from '../hooks/useFeesModule'
import type { FinanceViewShell } from '../financePageTypes'

type Props = {
  model: FeesModel
  shell: FinanceViewShell
}

export function FeesView({ model, shell }: Props) {
  const {
    feeInvoiceModalOpen,
    feeInvoicePartnerFilter,
    feeInvoiceSearch,
    feeInvoiceShipmentFilter,
    feeInvoiceStatusFilter,
    feeInvoiceTypeFilter,
    feePayablePartnerFilter,
    feePayableSearch,
    feePayableShipmentFilter,
    feePayableStatusFilter,
    feePayableTypeFilter,
    feePayables,
    feePaymentApprovalForm,
    feePaymentRequestForm,
    feePaymentRequests,
    loadFeePayables,
    loadPartnerFeeInvoices,
    loadingFeePayables,
    loadingFeePaymentRequests,
    loadingPartnerFeeInvoices,
    partnerFeeInvoiceForm,
    partnerFeeInvoices,
    selectedFeePaymentRequest,
    selectedFeePaymentRequestCanApprove,
    selectedPartnerFeeInvoice,
    setFeeInvoiceModalOpen,
    setFeeInvoicePartnerFilter,
    setFeeInvoiceSearch,
    setFeeInvoiceShipmentFilter,
    setFeeInvoiceStatusFilter,
    setFeeInvoiceTypeFilter,
    setFeePayablePartnerFilter,
    setFeePayableSearch,
    setFeePayableShipmentFilter,
    setFeePayableStatusFilter,
    setFeePayableTypeFilter,
    setFeePaymentApprovalForm,
    setFeePaymentRequestForm,
    setPartnerFeeInvoiceForm,
    setSelectedFeePaymentRequestId,
    setSelectedPartnerFeeInvoiceId,
    submitFeePaymentApproval,
    submitFeePaymentRequest,
    submitPartnerFeeInvoice,
    submittingFeePaymentApproval,
    submittingFeePaymentRequest,
    submittingPartnerFeeInvoice,
  } = model
  const { detailId, goModule, goDetail, moduleAlerts, moduleHeader, currentUser } = shell

  return (
    <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
      {detailId ? (
        <div className="finance-subnav">
          <button className="finance-back-button" type="button" onClick={() => goModule('fees')}>
            <ArrowLeft size={16} />
            {t('finance.fee.title')}
          </button>
        </div>
      ) : (
        moduleHeader
      )}
      {moduleAlerts}
      <section
        className={detailId ? 'finance-detail-grid' : 'finance-fee-grid'}
        aria-label={t('finance.fee.title')}
      >
        {!detailId ? (
          <section className="workspace-panel finance-fee-list-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<Wallet size={18} />}
                title={t('finance.fee.panel.invoices')}
              />
              <form
                className="inline-filters single-line-filter-toolbar"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadPartnerFeeInvoices()
                }}
              >
                <label>
                  {t('finance.fee.filter.invoiceSearch')}
                  <Input
                    value={feeInvoiceSearch}
                    onChange={(event) => setFeeInvoiceSearch(event.target.value)}
                  />
                </label>
                <label>
                  {t('finance.fee.filter.invoiceStatus')}
                  <FormSelect
                    value={feeInvoiceStatusFilter}
                    onChange={(event) => setFeeInvoiceStatusFilter(event.target.value)}
                  >
                    <option value="">{t('finance.fee.filter.allStatuses')}</option>
                    {partnerFeeInvoiceStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('finance.fee.field.feeType')}
                  <FormSelect
                    value={feeInvoiceTypeFilter}
                    onChange={(event) => setFeeInvoiceTypeFilter(event.target.value)}
                  >
                    <option value="">{t('finance.fee.filter.allTypes')}</option>
                    {feeTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('finance.fee.field.partnerId')}
                  <Input
                    value={feeInvoicePartnerFilter}
                    onChange={(event) => setFeeInvoicePartnerFilter(event.target.value)}
                  />
                </label>
                <label>
                  {t('finance.fee.field.shipmentNo')}
                  <Input
                    value={feeInvoiceShipmentFilter}
                    onChange={(event) => setFeeInvoiceShipmentFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('finance.fee.action.search')}
                </Button>
                <Button
                  type="primary"
                  icon={<Plus size={16} />}
                  onClick={() => setFeeInvoiceModalOpen(true)}
                >
                  {t('finance.fee.action.registerInvoice')}
                </Button>
              </form>
            </div>
            <Table<PartnerFeeInvoice>
              columns={[
                {
                  title: t('finance.fee.table.feeInvoice'),
                  dataIndex: 'invoice_no',
                  render: (value: string) => (
                    <button className="row-button" type="button">
                      {value}
                    </button>
                  ),
                },
                { title: t('finance.field.status'), dataIndex: 'status', render: partnerFeeInvoiceStatusTag },
                { title: t('finance.fee.table.partner'), dataIndex: 'partner_name' },
                { title: t('finance.fee.table.shipment'), dataIndex: 'shipment_no', render: nullableText },
                { title: t('finance.fee.field.feeType'), dataIndex: 'fee_type', render: feeTypeLabel },
                {
                  title: t('finance.fee.field.invoiceAmount'),
                  dataIndex: 'total_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.fee.field.unpaid'),
                  dataIndex: 'unpaid_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
              ]}
              dataSource={partnerFeeInvoices}
              loading={loadingPartnerFeeInvoices}
              pagination={false}
              rowClassName={(record) =>
                record.id === selectedPartnerFeeInvoice?.id ? 'selected-row' : ''
              }
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => {
                  setSelectedPartnerFeeInvoiceId(record.id)
                  setFeePaymentRequestForm(initialFeePaymentRequestForm(record))
                  setFeePaymentApprovalForm(
                    initialFeePaymentApprovalForm(record.unpaid_amount, currentUser.display_name),
                  )
                  goDetail('fees', record.id)
                },
              })}
            />
          </section>
        ) : null}

        {!detailId ? (
          <Modal
            centered
            footer={null}
            open={feeInvoiceModalOpen}
            title={t('finance.fee.modal.registerInvoiceTitle')}
            width={760}
            onCancel={() => setFeeInvoiceModalOpen(false)}
          >
            <form
              className="record-form"
              onSubmit={(e) => {
                submitPartnerFeeInvoice(e)
                setFeeInvoiceModalOpen(false)
              }}
            >
              <div className="form-pair two">
                <label>
                  {t('finance.fee.field.feeInvoiceNo')}
                  <Input
                    value={partnerFeeInvoiceForm.invoice_no}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        invoice_no: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('finance.fee.field.invoiceDate')}
                  <Input
                    type="date"
                    value={partnerFeeInvoiceForm.invoice_date}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        invoice_date: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  {t('finance.fee.field.partnerId')}
                  <Input
                    value={partnerFeeInvoiceForm.partner_id}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        partner_id: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('finance.fee.field.partnerName')}
                  <Input
                    value={partnerFeeInvoiceForm.partner_name}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        partner_name: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  {t('finance.fee.field.partnerType')}
                  <FormSelect
                    value={partnerFeeInvoiceForm.partner_type}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        partner_type: event.target.value,
                      })
                    }
                  >
                    <option value="">{t('finance.fee.field.autoMatch')}</option>
                    {partnerTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('finance.fee.field.feeType')}
                  <FormSelect
                    value={partnerFeeInvoiceForm.fee_type}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        fee_type: event.target.value,
                      })
                    }
                  >
                    {feeTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  {t('finance.fee.field.shipmentId')}
                  <Input
                    value={partnerFeeInvoiceForm.shipment_plan_id}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        shipment_plan_id: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('finance.fee.field.shipmentNo')}
                  <Input
                    value={partnerFeeInvoiceForm.shipment_no}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        shipment_no: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  {t('finance.fee.field.salesUserId')}
                  <Input
                    value={partnerFeeInvoiceForm.sales_user_id}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        sales_user_id: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('finance.fee.field.salesUserName')}
                  <Input
                    value={partnerFeeInvoiceForm.sales_user_name}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        sales_user_name: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair three">
                <label>
                  {t('finance.fee.field.invoiceAmount')}
                  <Input
                    value={partnerFeeInvoiceForm.total_amount}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        total_amount: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('finance.field.currency')}
                  <Input
                    value={partnerFeeInvoiceForm.currency}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        currency: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('finance.fee.field.dueDate')}
                  <Input
                    type="date"
                    value={partnerFeeInvoiceForm.due_date}
                    onChange={(event) =>
                      setPartnerFeeInvoiceForm({
                        ...partnerFeeInvoiceForm,
                        due_date: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <label>
                {t('finance.fee.field.remark')}
                <Input
                  value={partnerFeeInvoiceForm.remark}
                  onChange={(event) =>
                    setPartnerFeeInvoiceForm({
                      ...partnerFeeInvoiceForm,
                      remark: event.target.value,
                    })
                  }
                />
              </label>
              <div className="modal-actions">
                <button
                  className="secondary-inline"
                  type="button"
                  onClick={() => setFeeInvoiceModalOpen(false)}
                >
                  {t('finance.fee.action.cancel')}
                </button>
                <button
                  className="inline-submit"
                  disabled={submittingPartnerFeeInvoice}
                  type="submit"
                >
                  {t('finance.fee.action.submitInvoice')}
                </button>
              </div>
            </form>
          </Modal>
        ) : null}

        {detailId ? (
          <section className="workspace-panel finance-fee-request-panel">
            <PanelTitle
              icon={<CheckCircle2 size={18} />}
              title={t('finance.fee.panel.paymentRequests')}
            />
            {selectedPartnerFeeInvoice ? (
              <dl className="detail-list finance-fee-detail-list">
                <div>
                  <dt>{t('finance.fee.field.currentInvoice')}</dt>
                  <dd>{selectedPartnerFeeInvoice.invoice_no}</dd>
                </div>
                <div>
                  <dt>{t('finance.fee.field.feeType')}</dt>
                  <dd>{feeTypeLabel(selectedPartnerFeeInvoice.fee_type)}</dd>
                </div>
                <div>
                  <dt>{t('finance.fee.field.paid')}</dt>
                  <dd>
                    {formatFinanceAmount(
                      selectedPartnerFeeInvoice.paid_amount,
                      selectedPartnerFeeInvoice.currency,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>{t('finance.fee.field.unpaid')}</dt>
                  <dd>
                    {formatFinanceAmount(
                      selectedPartnerFeeInvoice.unpaid_amount,
                      selectedPartnerFeeInvoice.currency,
                    )}
                  </dd>
                </div>
              </dl>
            ) : (
              <div className="module-state">{t('finance.fee.message.noInvoice')}</div>
            )}
            <div className="finance-receipt-actions">
              <form className="record-form compact-section" onSubmit={submitFeePaymentRequest}>
                <div className="form-divider">{t('finance.fee.panel.newPaymentRequest')}</div>
                <div className="finance-payment-fields">
                  <label>
                    {t('finance.fee.field.requestNo')}
                    <Input
                      readOnly
                      value={feePaymentRequestForm.request_no}
                      placeholder={t('finance.form.codeAutoGenerated')}
                    />
                  </label>
                  <label>
                    {t('finance.fee.field.partnerFeeInvoiceId')}
                    <Input
                      value={feePaymentRequestForm.partner_fee_invoice_id}
                      onChange={(event) =>
                        setFeePaymentRequestForm({
                          ...feePaymentRequestForm,
                          partner_fee_invoice_id: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    {t('finance.fee.field.requestDate')}
                    <Input
                      type="date"
                      value={feePaymentRequestForm.request_date}
                      onChange={(event) =>
                        setFeePaymentRequestForm({
                          ...feePaymentRequestForm,
                          request_date: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    {t('finance.fee.field.requestedAmount')}
                    <Input
                      value={feePaymentRequestForm.requested_amount}
                      onChange={(event) =>
                        setFeePaymentRequestForm({
                          ...feePaymentRequestForm,
                          requested_amount: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    {t('finance.field.currency')}
                    <Input
                      value={feePaymentRequestForm.currency}
                      onChange={(event) =>
                        setFeePaymentRequestForm({
                          ...feePaymentRequestForm,
                          currency: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    {t('finance.fee.field.requestRemark')}
                    <Input
                      value={feePaymentRequestForm.remark}
                      onChange={(event) =>
                        setFeePaymentRequestForm({
                          ...feePaymentRequestForm,
                          remark: event.target.value,
                        })
                      }
                    />
                  </label>
                  <ApprovalAssigneeSelect
                    currentUserId={currentUser.id}
                    onChange={(reviewer_id) =>
                      setFeePaymentRequestForm({ ...feePaymentRequestForm, reviewer_id })
                    }
                    requiredPermission="finance:view"
                    value={feePaymentRequestForm.reviewer_id}
                  />
                </div>
                <Button
                  htmlType="submit"
                  icon={<Save size={16} />}
                  loading={submittingFeePaymentRequest}
                  disabled={!selectedPartnerFeeInvoice || !feePaymentRequestForm.reviewer_id}
                >
                  {t('finance.fee.action.createPaymentRequest')}
                </Button>
              </form>
              <form className="record-form compact-section" onSubmit={submitFeePaymentApproval}>
                <div className="form-divider">{t('finance.fee.panel.paymentApproval')}</div>
                <div className="finance-payment-fields">
                  <label>
                    {t('finance.fee.field.approvedAmount')}
                    <Input
                      value={feePaymentApprovalForm.approved_amount}
                      onChange={(event) =>
                        setFeePaymentApprovalForm({
                          ...feePaymentApprovalForm,
                          approved_amount: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    {t('finance.fee.field.approvedAt')}
                    <Input
                      type="date"
                      value={feePaymentApprovalForm.approved_at}
                      onChange={(event) =>
                        setFeePaymentApprovalForm({
                          ...feePaymentApprovalForm,
                          approved_at: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    {t('finance.fee.field.reviewer')}
                    <Input disabled value={selectedFeePaymentRequest?.reviewer_name ?? ''} />
                  </label>
                  <label>
                    {t('finance.fee.field.paymentAccount')}
                    <Input
                      value={feePaymentApprovalForm.payment_account}
                      onChange={(event) =>
                        setFeePaymentApprovalForm({
                          ...feePaymentApprovalForm,
                          payment_account: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    {t('finance.fee.field.approvalRemark')}
                    <Input
                      value={feePaymentApprovalForm.remark}
                      onChange={(event) =>
                        setFeePaymentApprovalForm({
                          ...feePaymentApprovalForm,
                          remark: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <Button
                  htmlType="submit"
                  icon={<CheckCircle2 size={16} />}
                  loading={submittingFeePaymentApproval}
                  disabled={!selectedFeePaymentRequestCanApprove}
                >
                  {t('finance.fee.action.approvePayment')}
                </Button>
                {selectedFeePaymentRequest?.status === 'submitted' &&
                !selectedFeePaymentRequestCanApprove ? (
                  <Alert
                    showIcon
                    type="info"
                    message={t('finance.fee.message.waitingApproval', {
                      reviewer:
                        selectedFeePaymentRequest.reviewer_name ??
                        t('finance.fee.message.designatedReviewer'),
                    })}
                  />
                ) : null}
              </form>
            </div>
            <section className="finance-allocation-history">
              <strong>{t('finance.fee.panel.paymentRequestList')}</strong>
              <Table<FeePaymentRequest>
                columns={[
                  {
                    title: t('finance.fee.table.requestNo'),
                    dataIndex: 'request_no',
                    render: (value: string) => (
                      <button className="row-button" type="button">
                        {value}
                      </button>
                    ),
                  },
                  { title: t('finance.field.status'), dataIndex: 'status', render: feePaymentRequestStatusTag },
                  { title: t('finance.fee.field.feeType'), dataIndex: 'fee_type', render: feeTypeLabel },
                  { title: t('finance.fee.table.partner'), dataIndex: 'partner_name' },
                  { title: t('finance.fee.table.shipment'), dataIndex: 'shipment_no', render: nullableText },
                  {
                    title: t('finance.fee.field.requestedAmount'),
                    dataIndex: 'requested_amount',
                    render: (value: string, record) => formatFinanceAmount(value, record.currency),
                  },
                  {
                    title: t('finance.fee.field.paid'),
                    dataIndex: 'paid_amount',
                    render: (value: string, record) => formatFinanceAmount(value, record.currency),
                  },
                ]}
                dataSource={feePaymentRequests}
                loading={loadingFeePaymentRequests}
                pagination={false}
                rowClassName={(record) =>
                  record.id === selectedFeePaymentRequest?.id ? 'selected-row' : ''
                }
                rowKey="id"
                size="small"
                onRow={(record) => ({
                  onClick: () => {
                    setSelectedFeePaymentRequestId(record.id)
                    setFeePaymentApprovalForm(
                      initialFeePaymentApprovalForm(
                        record.requested_amount,
                        currentUser.display_name,
                      ),
                    )
                  },
                })}
              />
            </section>
          </section>
        ) : null}

        {!detailId ? (
          <section className="workspace-panel finance-fee-payable-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<ShieldCheck size={18} />}
                title={t('finance.fee.panel.payables')}
              />
              <form
                className="inline-filters single-line-filter-toolbar"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadFeePayables()
                }}
              >
                <label>
                  {t('finance.fee.filter.payableSearch')}
                  <Input
                    value={feePayableSearch}
                    onChange={(event) => setFeePayableSearch(event.target.value)}
                  />
                </label>
                <label>
                  {t('finance.fee.filter.payableStatus')}
                  <FormSelect
                    value={feePayableStatusFilter}
                    onChange={(event) => setFeePayableStatusFilter(event.target.value)}
                  >
                    <option value="">{t('finance.fee.filter.allStatuses')}</option>
                    {partnerFeeInvoiceStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('finance.fee.field.feeType')}
                  <FormSelect
                    value={feePayableTypeFilter}
                    onChange={(event) => setFeePayableTypeFilter(event.target.value)}
                  >
                    <option value="">{t('finance.fee.filter.allTypes')}</option>
                    {feeTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('finance.fee.field.partnerId')}
                  <Input
                    value={feePayablePartnerFilter}
                    onChange={(event) => setFeePayablePartnerFilter(event.target.value)}
                  />
                </label>
                <label>
                  {t('finance.fee.field.shipmentNo')}
                  <Input
                    value={feePayableShipmentFilter}
                    onChange={(event) => setFeePayableShipmentFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('finance.fee.action.search')}
                </Button>
              </form>
            </div>
            <Table<FeePayableItem>
              columns={[
                {
                  title: t('finance.fee.table.feeInvoice'),
                  dataIndex: 'invoice_no',
                  render: (value: string) => <strong>{value}</strong>,
                },
                { title: t('finance.fee.table.partner'), dataIndex: 'partner_name' },
                { title: t('finance.fee.table.shipment'), dataIndex: 'shipment_no', render: nullableText },
                { title: t('finance.fee.field.feeType'), dataIndex: 'fee_type', render: feeTypeLabel },
                {
                  title: t('finance.fee.field.invoiceAmount'),
                  dataIndex: 'total_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.fee.table.paidAmount'),
                  dataIndex: 'paid_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.fee.table.payableBalance'),
                  dataIndex: 'payable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                { title: t('finance.field.status'), dataIndex: 'status', render: partnerFeeInvoiceStatusTag },
              ]}
              dataSource={feePayables}
              loading={loadingFeePayables}
              pagination={false}
              rowKey="partner_fee_invoice_id"
              size="small"
            />
          </section>
        ) : null}
      </section>
    </section>
  )
}
