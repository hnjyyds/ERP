import { Alert, Button, Input, Modal, Table } from 'antd'
import { ArrowLeft, Plus, Search, CheckCircle2, Save, ShieldCheck } from 'lucide-react'
import {
  type PayableItem,
  type SupplierInvoice,
  type SupplierPaymentRequest,
} from '@/api'
import { FormSelect, PanelTitle } from '@/shared/ui'
import { supplierInvoiceStatusOptions, paymentTypeOptions } from '@/shared/formOptions'
import { formatFinanceAmount, nullableText } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import {
  initialPaymentRequestForm,
  initialPaymentApprovalForm,
  supplierInvoiceStatusLabel,
  supplierInvoiceStatusTag,
  paymentRequestStatusTag,
  paymentTypeLabel,
} from '@/app/pages/finance/financeHelpers'
import { ApprovalAssigneeSelect } from '@/app/components/ApprovalAssigneeSelect'
import type { PaymentsModel } from '@/app/pages/finance/hooks/usePaymentsModule'
import type { FinanceViewShell } from '@/app/pages/finance/financePageTypes'

type Props = {
  model: PaymentsModel
  shell: FinanceViewShell
}

export function PaymentsView({ model, shell }: Props) {
  const {
    changePayablesPage,
    changeSupplierInvoicesPage,
    invoiceContractFilter,
    invoiceModalOpen,
    invoiceSearch,
    invoiceStatusFilter,
    invoiceSupplierFilter,
    loadingPayables,
    loadingPaymentRequests,
    loadingSupplierInvoices,
    payableContractFilter,
    payableSearch,
    payableStatusFilter,
    payableSupplierFilter,
    payables,
    payablesPagination,
    paymentApprovalForm,
    paymentRequestForm,
    paymentRequests,
    selectedPaymentRequest,
    selectedPaymentRequestCanApprove,
    selectedSupplierInvoice,
    supplierInvoicesPagination,
    setInvoiceContractFilter,
    setInvoiceModalOpen,
    setInvoiceSearch,
    setInvoiceStatusFilter,
    setInvoiceSupplierFilter,
    setPayableContractFilter,
    setPayableSearch,
    setPayableStatusFilter,
    setPayableSupplierFilter,
    setPaymentApprovalForm,
    setPaymentRequestForm,
    setSelectedPaymentRequestId,
    setSelectedSupplierInvoiceId,
    setSupplierInvoiceForm,
    setSupplierInvoiceNoError,
    submitPaymentApproval,
    submitPaymentRequest,
    submitSupplierInvoice,
    submittingPaymentApproval,
    submittingPaymentRequest,
    submittingSupplierInvoice,
    supplierInvoiceForm,
    supplierInvoiceNoError,
    supplierInvoices,
  } = model
  const { detailId, goModule, goDetail, moduleAlerts, moduleHeader, currentUser } = shell

  return (
    <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
      {detailId ? (
        <div className="finance-subnav">
          <button
            className="finance-back-button"
            type="button"
            onClick={() => goModule('payments')}
          >
            <ArrowLeft size={16} />
            {t('finance.payment.title')}
          </button>
        </div>
      ) : (
        moduleHeader
      )}
      {moduleAlerts}
      <section
        className={detailId ? 'finance-detail-grid' : 'finance-payment-grid'}
        aria-label={t('finance.payment.title')}
      >
        {!detailId ? (
          <section className="workspace-panel finance-payment-list-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<Search size={18} />} title={t('finance.payment.panel.supplierInvoices')} />
              <form
                className="inline-filters single-line-filter-toolbar"
                onSubmit={(event) => {
                  event.preventDefault()
                  void changeSupplierInvoicesPage(1, supplierInvoicesPagination.pageSize)
                }}
              >
                <label>
                  {t('finance.payment.filter.invoiceSearch')}
                  <Input
                    value={invoiceSearch}
                    onChange={(event) => setInvoiceSearch(event.target.value)}
                  />
                </label>
                <label>
                  {t('finance.payment.filter.invoiceStatus')}
                  <FormSelect
                    value={invoiceStatusFilter}
                    onChange={(event) => setInvoiceStatusFilter(event.target.value)}
                  >
                    <option value="">{t('finance.payment.filter.allStatuses')}</option>
                    {supplierInvoiceStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('finance.payment.field.supplierId')}
                  <Input
                    value={invoiceSupplierFilter}
                    onChange={(event) => setInvoiceSupplierFilter(event.target.value)}
                  />
                </label>
                <label>
                  {t('finance.payment.field.purchaseContractNo')}
                  <Input
                    value={invoiceContractFilter}
                    onChange={(event) => setInvoiceContractFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('finance.payment.action.search')}
                </Button>
                <Button
                  type="primary"
                  icon={<Plus size={16} />}
                  onClick={() => {
                    setSupplierInvoiceNoError('')
                    setInvoiceModalOpen(true)
                  }}
                >
                  {t('finance.payment.action.registerInvoice')}
                </Button>
              </form>
            </div>
            <Table<SupplierInvoice>
              columns={[
                {
                  title: t('finance.payment.table.supplierInvoice'),
                  dataIndex: 'invoice_no',
                  render: (value: string) => (
                    <button className="row-button" type="button">
                      {value}
                    </button>
                  ),
                },
                { title: t('finance.field.status'), dataIndex: 'status', render: supplierInvoiceStatusTag },
                { title: t('finance.payment.table.supplier'), dataIndex: 'supplier_name' },
                { title: t('finance.payment.table.purchaseContract'), dataIndex: 'purchase_contract_no', render: nullableText },
                {
                  title: t('finance.payment.field.invoiceAmount'),
                  dataIndex: 'total_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.payment.field.unpaid'),
                  dataIndex: 'unpaid_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
              ]}
              dataSource={supplierInvoices}
              loading={loadingSupplierInvoices}
              pagination={{
                ...supplierInvoicesPagination,
                onChange: (nextPage, nextPageSize) => {
                  void changeSupplierInvoicesPage(nextPage, nextPageSize)
                },
              }}
              rowClassName={(record) =>
                record.id === selectedSupplierInvoice?.id ? 'selected-row' : ''
              }
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => {
                  setSelectedSupplierInvoiceId(record.id)
                  setPaymentRequestForm(initialPaymentRequestForm(record))
                  setPaymentApprovalForm(
                    initialPaymentApprovalForm(record.unpaid_amount, currentUser.display_name),
                  )
                  goDetail('payments', record.id)
                },
              })}
            />
          </section>
        ) : null}

        {!detailId ? (
          <Modal
            centered
            footer={null}
            open={invoiceModalOpen}
            title={t('finance.payment.modal.supplierInvoiceTitle')}
            width={760}
            onCancel={() => setInvoiceModalOpen(false)}
          >
            <form className="record-form" onSubmit={submitSupplierInvoice}>
              <div className="form-pair two">
                <label>
                  {t('finance.payment.field.supplierInvoiceNo')}
                  <Input
                    aria-invalid={Boolean(supplierInvoiceNoError)}
                    aria-describedby="supplier-invoice-no-error"
                    value={supplierInvoiceForm.invoice_no}
                    onChange={(event) => {
                      setSupplierInvoiceNoError('')
                      setSupplierInvoiceForm({
                        ...supplierInvoiceForm,
                        invoice_no: event.target.value,
                      })
                    }}
                  />
                  {supplierInvoiceNoError ? (
                    <span className="form-field-error" id="supplier-invoice-no-error">
                      {supplierInvoiceNoError}
                    </span>
                  ) : null}
                </label>
                <label>
                  {t('finance.payment.field.invoiceDate')}
                  <Input
                    type="date"
                    value={supplierInvoiceForm.invoice_date}
                    onChange={(event) =>
                      setSupplierInvoiceForm({
                        ...supplierInvoiceForm,
                        invoice_date: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  {t('finance.payment.field.supplierId')}
                  <Input
                    value={supplierInvoiceForm.supplier_id}
                    onChange={(event) =>
                      setSupplierInvoiceForm({
                        ...supplierInvoiceForm,
                        supplier_id: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('finance.payment.field.supplierName')}
                  <Input
                    value={supplierInvoiceForm.supplier_name}
                    onChange={(event) =>
                      setSupplierInvoiceForm({
                        ...supplierInvoiceForm,
                        supplier_name: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  {t('finance.payment.field.invoiceNoticeId')}
                  <Input
                    value={supplierInvoiceForm.purchase_invoice_notice_id}
                    onChange={(event) =>
                      setSupplierInvoiceForm({
                        ...supplierInvoiceForm,
                        purchase_invoice_notice_id: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('finance.payment.field.invoiceNoticeCode')}
                  <Input
                    value={supplierInvoiceForm.purchase_invoice_notice_code}
                    onChange={(event) =>
                      setSupplierInvoiceForm({
                        ...supplierInvoiceForm,
                        purchase_invoice_notice_code: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  {t('finance.payment.field.purchaseContractId')}
                  <Input
                    value={supplierInvoiceForm.purchase_contract_id}
                    onChange={(event) =>
                      setSupplierInvoiceForm({
                        ...supplierInvoiceForm,
                        purchase_contract_id: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('finance.payment.field.purchaseContractNo')}
                  <Input
                    value={supplierInvoiceForm.purchase_contract_no}
                    onChange={(event) =>
                      setSupplierInvoiceForm({
                        ...supplierInvoiceForm,
                        purchase_contract_no: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair three">
                <label>
                  {t('finance.payment.field.invoiceAmount')}
                  <Input
                    value={supplierInvoiceForm.total_amount}
                    onChange={(event) =>
                      setSupplierInvoiceForm({
                        ...supplierInvoiceForm,
                        total_amount: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('finance.field.currency')}
                  <Input
                    value={supplierInvoiceForm.currency}
                    onChange={(event) =>
                      setSupplierInvoiceForm({
                        ...supplierInvoiceForm,
                        currency: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('finance.payment.field.dueDate')}
                  <Input
                    type="date"
                    value={supplierInvoiceForm.due_date}
                    onChange={(event) =>
                      setSupplierInvoiceForm({
                        ...supplierInvoiceForm,
                        due_date: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <label>
                {t('finance.payment.field.remark')}
                <Input
                  value={supplierInvoiceForm.remark}
                  onChange={(event) =>
                    setSupplierInvoiceForm({ ...supplierInvoiceForm, remark: event.target.value })
                  }
                />
              </label>
              <div className="modal-actions">
                <button
                  className="secondary-inline"
                  type="button"
                  onClick={() => setInvoiceModalOpen(false)}
                >
                  {t('finance.payment.action.cancel')}
                </button>
                <button
                  className="inline-submit"
                  disabled={submittingSupplierInvoice}
                  type="submit"
                >
                  {t('finance.payment.action.submitSupplierInvoice')}
                </button>
              </div>
            </form>
          </Modal>
        ) : null}

        {detailId ? (
          <section className="workspace-panel finance-payment-request-panel">
            <PanelTitle icon={<CheckCircle2 size={18} />} title={t('finance.payment.panel.paymentRequests')} />
            {selectedSupplierInvoice ? (
              <dl className="detail-list finance-payment-detail-list">
                <div>
                  <dt>{t('finance.payment.field.currentInvoice')}</dt>
                  <dd>{selectedSupplierInvoice.invoice_no}</dd>
                </div>
                <div>
                  <dt>{t('finance.field.status')}</dt>
                  <dd>{supplierInvoiceStatusLabel(selectedSupplierInvoice.status)}</dd>
                </div>
                <div>
                  <dt>{t('finance.payment.field.paid')}</dt>
                  <dd>
                    {formatFinanceAmount(
                      selectedSupplierInvoice.paid_amount,
                      selectedSupplierInvoice.currency,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>{t('finance.payment.field.unpaid')}</dt>
                  <dd>
                    {formatFinanceAmount(
                      selectedSupplierInvoice.unpaid_amount,
                      selectedSupplierInvoice.currency,
                    )}
                  </dd>
                </div>
              </dl>
            ) : (
              <div className="module-state">{t('finance.payment.message.noSupplierInvoice')}</div>
            )}
            <div className="finance-receipt-actions">
              <form className="record-form compact-section" onSubmit={submitPaymentRequest}>
                <div className="form-divider">{t('finance.payment.panel.newPaymentRequest')}</div>
                <div className="finance-payment-fields">
                  <label>
                    {t('finance.payment.field.requestNo')}
                    <Input
                      readOnly
                      value={paymentRequestForm.request_no}
                      placeholder={t('finance.form.codeAutoGenerated')}
                    />
                  </label>
                  <label>
                    {t('finance.payment.field.supplierInvoiceId')}
                    <Input
                      value={paymentRequestForm.supplier_invoice_id}
                      onChange={(event) =>
                        setPaymentRequestForm({
                          ...paymentRequestForm,
                          supplier_invoice_id: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    {t('finance.payment.field.paymentType')}
                    <FormSelect
                      value={paymentRequestForm.payment_type}
                      onChange={(event) =>
                        setPaymentRequestForm({
                          ...paymentRequestForm,
                          payment_type: event.target.value,
                        })
                      }
                    >
                      {paymentTypeOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {t(item.labelKey)}
                        </option>
                      ))}
                    </FormSelect>
                  </label>
                  <label>
                    {t('finance.payment.field.requestDate')}
                    <Input
                      type="date"
                      value={paymentRequestForm.request_date}
                      onChange={(event) =>
                        setPaymentRequestForm({
                          ...paymentRequestForm,
                          request_date: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    {t('finance.payment.field.requestedAmount')}
                    <Input
                      value={paymentRequestForm.requested_amount}
                      onChange={(event) =>
                        setPaymentRequestForm({
                          ...paymentRequestForm,
                          requested_amount: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    {t('finance.field.currency')}
                    <Input
                      value={paymentRequestForm.currency}
                      onChange={(event) =>
                        setPaymentRequestForm({
                          ...paymentRequestForm,
                          currency: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    {t('finance.payment.field.requestRemark')}
                    <Input
                      value={paymentRequestForm.remark}
                      onChange={(event) =>
                        setPaymentRequestForm({
                          ...paymentRequestForm,
                          remark: event.target.value,
                        })
                      }
                    />
                  </label>
                  <ApprovalAssigneeSelect
                    currentUserId={currentUser.id}
                    onChange={(reviewer_id) =>
                      setPaymentRequestForm({ ...paymentRequestForm, reviewer_id })
                    }
                    requiredPermission="finance:view"
                    value={paymentRequestForm.reviewer_id}
                  />
                </div>
                <Button
                  htmlType="submit"
                  icon={<Save size={16} />}
                  loading={submittingPaymentRequest}
                  disabled={!selectedSupplierInvoice || !paymentRequestForm.reviewer_id}
                >
                  {t('finance.payment.action.createPaymentRequest')}
                </Button>
              </form>
              <form className="record-form compact-section" onSubmit={submitPaymentApproval}>
                <div className="form-divider">{t('finance.payment.panel.paymentApproval')}</div>
                <div className="finance-payment-fields">
                  <label>
                    {t('finance.payment.field.approvedAmount')}
                    <Input
                      value={paymentApprovalForm.approved_amount}
                      onChange={(event) =>
                        setPaymentApprovalForm({
                          ...paymentApprovalForm,
                          approved_amount: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    {t('finance.payment.field.approvedAt')}
                    <Input
                      type="date"
                      value={paymentApprovalForm.approved_at}
                      onChange={(event) =>
                        setPaymentApprovalForm({
                          ...paymentApprovalForm,
                          approved_at: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    {t('finance.payment.field.reviewer')}
                    <Input disabled value={selectedPaymentRequest?.reviewer_name ?? ''} />
                  </label>
                  <label>
                    {t('finance.payment.field.paymentAccount')}
                    <Input
                      value={paymentApprovalForm.payment_account}
                      onChange={(event) =>
                        setPaymentApprovalForm({
                          ...paymentApprovalForm,
                          payment_account: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    {t('finance.payment.field.approvalRemark')}
                    <Input
                      value={paymentApprovalForm.remark}
                      onChange={(event) =>
                        setPaymentApprovalForm({
                          ...paymentApprovalForm,
                          remark: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
                <Button
                  htmlType="submit"
                  icon={<CheckCircle2 size={16} />}
                  loading={submittingPaymentApproval}
                  disabled={!selectedPaymentRequestCanApprove}
                >
                  {t('finance.payment.action.approvePayment')}
                </Button>
                {selectedPaymentRequest?.status === 'submitted' &&
                !selectedPaymentRequestCanApprove ? (
                  <Alert
                    showIcon
                    type="info"
                    message={t('finance.payment.message.waitingApproval', {
                      reviewer:
                        selectedPaymentRequest.reviewer_name ??
                        t('finance.payment.message.designatedReviewer'),
                    })}
                  />
                ) : null}
              </form>
            </div>
            <section className="finance-allocation-history">
              <strong>{t('finance.payment.panel.paymentRequestList')}</strong>
              <Table<SupplierPaymentRequest>
                columns={[
                  {
                    title: t('finance.payment.table.requestNo'),
                    dataIndex: 'request_no',
                    render: (value: string) => (
                      <button className="row-button" type="button">
                        {value}
                      </button>
                    ),
                  },
                  { title: t('finance.field.status'), dataIndex: 'status', render: paymentRequestStatusTag },
                  { title: t('finance.payment.table.category'), dataIndex: 'payment_type', render: paymentTypeLabel },
                  { title: t('finance.payment.table.supplier'), dataIndex: 'supplier_name' },
                  { title: t('finance.payment.table.invoiceNo'), dataIndex: 'supplier_invoice_no' },
                  {
                    title: t('finance.payment.field.requestedAmount'),
                    dataIndex: 'requested_amount',
                    render: (value: string, record) => formatFinanceAmount(value, record.currency),
                  },
                  {
                    title: t('finance.payment.field.paid'),
                    dataIndex: 'paid_amount',
                    render: (value: string, record) => formatFinanceAmount(value, record.currency),
                  },
                ]}
                dataSource={paymentRequests}
                loading={loadingPaymentRequests}
                pagination={false}
                rowClassName={(record) =>
                  record.id === selectedPaymentRequest?.id ? 'selected-row' : ''
                }
                rowKey="id"
                size="small"
                onRow={(record) => ({
                  onClick: () => {
                    setSelectedPaymentRequestId(record.id)
                    setPaymentApprovalForm(
                      initialPaymentApprovalForm(record.requested_amount, currentUser.display_name),
                    )
                  },
                })}
              />
            </section>
          </section>
        ) : null}

        {!detailId ? (
          <section className="workspace-panel finance-payable-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<ShieldCheck size={18} />} title={t('finance.payment.panel.payables')} />
              <form
                className="inline-filters single-line-filter-toolbar"
                onSubmit={(event) => {
                  event.preventDefault()
                  void changePayablesPage(1, payablesPagination.pageSize)
                }}
              >
                <label>
                  {t('finance.payment.filter.payableSearch')}
                  <Input
                    value={payableSearch}
                    onChange={(event) => setPayableSearch(event.target.value)}
                  />
                </label>
                <label>
                  {t('finance.payment.filter.payableStatus')}
                  <FormSelect
                    value={payableStatusFilter}
                    onChange={(event) => setPayableStatusFilter(event.target.value)}
                  >
                    <option value="">{t('finance.payment.filter.allStatuses')}</option>
                    {supplierInvoiceStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('finance.payment.field.supplierId')}
                  <Input
                    value={payableSupplierFilter}
                    onChange={(event) => setPayableSupplierFilter(event.target.value)}
                  />
                </label>
                <label>
                  {t('finance.payment.field.purchaseContractNo')}
                  <Input
                    value={payableContractFilter}
                    onChange={(event) => setPayableContractFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('finance.payment.action.search')}
                </Button>
              </form>
            </div>
            <Table<PayableItem>
              columns={[
                {
                  title: t('finance.payment.table.supplierInvoice'),
                  dataIndex: 'invoice_no',
                  render: (value: string) => <strong>{value}</strong>,
                },
                { title: t('finance.payment.table.supplier'), dataIndex: 'supplier_name' },
                { title: t('finance.payment.table.purchaseContract'), dataIndex: 'purchase_contract_no', render: nullableText },
                {
                  title: t('finance.payment.field.invoiceAmount'),
                  dataIndex: 'total_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.payment.table.paidAmount'),
                  dataIndex: 'paid_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.payment.table.payableBalance'),
                  dataIndex: 'payable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                { title: t('finance.field.status'), dataIndex: 'status', render: supplierInvoiceStatusTag },
              ]}
              dataSource={payables}
              loading={loadingPayables}
              pagination={{
                ...payablesPagination,
                onChange: (nextPage, nextPageSize) => {
                  void changePayablesPage(nextPage, nextPageSize)
                },
              }}
              rowKey="supplier_invoice_id"
              size="small"
            />
          </section>
        ) : null}
      </section>
    </section>
  )
}
