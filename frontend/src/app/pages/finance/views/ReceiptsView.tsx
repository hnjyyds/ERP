import { Button, Input, Modal, Table } from 'antd'
import { ArrowLeft, Plus, Search, CheckCircle2, Save, ShieldCheck } from 'lucide-react'
import { type BankReceipt, type ReceivableItem } from '../../../../api'
import { FormSelect, PanelTitle } from '../../../../shared/ui'
import {
  receiptStatusOptions,
  receiptTypeOptions,
  allocationTypeOptions,
} from '../../../../shared/formOptions'
import { formatDate, formatFinanceAmount, nullableText } from '../../appHelpers'
import { t } from '../../../appI18n'
import {
  initialReceiptAllocationForm,
  receiptStatusLabel,
  receiptStatusTag,
  receiptTypeLabel,
  allocationTypeLabel,
  receivableStatusTag,
} from '../financeHelpers'
import type { ReceiptsModel } from '../hooks/useReceiptsModule'
import type { FinanceViewShell } from '../financePageTypes'

type Props = {
  model: ReceiptsModel
  shell: FinanceViewShell
}

export function ReceiptsView({ model, shell }: Props) {
  const {
    allocationForm,
    claimForm,
    loadReceipts,
    loadReceivables,
    loadingReceipts,
    loadingReceivables,
    receiptCustomerFilter,
    receiptForm,
    receiptModalOpen,
    receiptSearch,
    receiptStatusFilter,
    receipts,
    receivableContractFilter,
    receivableInvoiceFilter,
    receivableSearch,
    receivables,
    selectedReceipt,
    selectedReceiptCanAllocate,
    selectedReceiptCanClaim,
    setAllocationForm,
    setClaimForm,
    setReceiptCustomerFilter,
    setReceiptForm,
    setReceiptModalOpen,
    setReceiptSearch,
    setReceiptStatusFilter,
    setReceivableContractFilter,
    setReceivableInvoiceFilter,
    setReceivableSearch,
    setSelectedReceiptId,
    submitAllocation,
    submitClaim,
    submitReceipt,
    submittingAllocation,
    submittingClaim,
    submittingReceipt,
    totalReceiptAmount,
    totalUnallocatedAmount,
  } = model
  const { detailId, goModule, goDetail, moduleAlerts, moduleHeader } = shell

  return (
    <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
      {detailId ? (
        <div className="finance-subnav">
          <button
            className="finance-back-button"
            type="button"
            onClick={() => goModule('receipts')}
          >
            <ArrowLeft size={16} />
            {t('finance.receipt.title')}
          </button>
        </div>
      ) : (
        moduleHeader
      )}
      {moduleAlerts}
      <section
        className={detailId ? 'finance-detail-grid' : 'finance-receipt-grid'}
        aria-label={t('finance.receipt.title')}
      >
        {!detailId ? (
          <section className="workspace-panel finance-receipt-list-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<Search size={18} />} title={t('finance.receipt.panel.receipts')} />
              <form
                className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadReceipts()
                }}
              >
                <label>
                  {t('finance.receipt.filter.receiptSearch')}
                  <Input
                    value={receiptSearch}
                    placeholder={t('finance.receipt.filter.receiptSearchPlaceholder')}
                    onChange={(event) => setReceiptSearch(event.target.value)}
                  />
                </label>
                <label>
                  {t('finance.receipt.filter.receiptStatus')}
                  <FormSelect
                    value={receiptStatusFilter}
                    onChange={(event) => setReceiptStatusFilter(event.target.value)}
                  >
                    <option value="">{t('finance.receipt.filter.allStatuses')}</option>
                    {receiptStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  {t('finance.receipt.field.customerId')}
                  <Input
                    value={receiptCustomerFilter}
                    placeholder={t('finance.receipt.filter.customerIdPlaceholder')}
                    onChange={(event) => setReceiptCustomerFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('finance.receipt.action.search')}
                </Button>
                <Button
                  type="primary"
                  icon={<Plus size={16} />}
                  onClick={() => setReceiptModalOpen(true)}
                >
                  {t('finance.receipt.action.registerReceipt')}
                </Button>
              </form>
            </div>

            <div className="finance-receipt-strip">
              <span>{t('finance.receipt.metric.listCount', { count: receipts.length })}</span>
              <strong>
                {formatFinanceAmount(totalReceiptAmount.toFixed(2), receipts[0]?.currency ?? 'USD')}
              </strong>
              <span>
                {t('finance.receipt.field.unallocatedAmount')}{' '}
                {formatFinanceAmount(
                  totalUnallocatedAmount.toFixed(2),
                  receipts[0]?.currency ?? 'USD',
                )}
              </span>
            </div>

            <Table<BankReceipt>
              columns={[
                {
                  title: t('finance.receipt.table.receiptNo'),
                  dataIndex: 'receipt_no',
                  render: (value: string) => (
                    <button className="row-button" type="button">
                      {value}
                    </button>
                  ),
                },
                { title: t('finance.field.status'), dataIndex: 'status', render: receiptStatusTag },
                { title: t('finance.receipt.table.nature'), dataIndex: 'receipt_type', render: receiptTypeLabel },
                { title: t('finance.receipt.table.receivedAt'), dataIndex: 'received_at', render: formatDate },
                { title: t('finance.receipt.field.payerName'), dataIndex: 'payer_name' },
                { title: t('finance.receipt.table.customer'), dataIndex: 'customer_name', render: nullableText },
                {
                  title: t('finance.field.amount'),
                  dataIndex: 'amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.receipt.field.unallocatedAmount'),
                  dataIndex: 'unallocated_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
              ]}
              dataSource={receipts}
              loading={loadingReceipts}
              pagination={false}
              rowClassName={(record) => (record.id === selectedReceipt?.id ? 'selected-row' : '')}
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => {
                  setSelectedReceiptId(record.id)
                  setAllocationForm(initialReceiptAllocationForm(record.currency))
                  goDetail('receipts', record.id)
                },
              })}
            />
          </section>
        ) : null}

        {!detailId ? (
          <Modal
            centered
            footer={null}
            open={receiptModalOpen}
            title={t('finance.receipt.modal.registerReceiptTitle')}
            width={720}
            onCancel={() => setReceiptModalOpen(false)}
          >
            <form
              className="record-form"
              onSubmit={(e) => {
                submitReceipt(e)
                setReceiptModalOpen(false)
              }}
            >
              <div className="form-pair two">
                <label>
                  {t('finance.receipt.field.receiptNo')}
                  <Input
                    readOnly
                    value={receiptForm.receipt_no}
                    placeholder={t('finance.form.codeAutoGenerated')}
                  />
                </label>
                <label>
                  {t('finance.receipt.field.receivedDate')}
                  <Input
                    type="date"
                    value={receiptForm.received_at}
                    onChange={(event) =>
                      setReceiptForm({ ...receiptForm, received_at: event.target.value })
                    }
                  />
                </label>
              </div>
              <label>
                {t('finance.receipt.field.payerName')}
                <Input
                  value={receiptForm.payer_name}
                  onChange={(event) =>
                    setReceiptForm({ ...receiptForm, payer_name: event.target.value })
                  }
                />
              </label>
              <div className="form-pair two">
                <label>
                  {t('finance.receipt.field.customerId')}
                  <Input
                    value={receiptForm.customer_id}
                    onChange={(event) =>
                      setReceiptForm({ ...receiptForm, customer_id: event.target.value })
                    }
                  />
                </label>
                <label>
                  {t('finance.receipt.field.customerName')}
                  <Input
                    value={receiptForm.customer_name}
                    onChange={(event) =>
                      setReceiptForm({ ...receiptForm, customer_name: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="form-pair three">
                <label>
                  {t('finance.receipt.field.receiptAmount')}
                  <Input
                    value={receiptForm.amount}
                    onChange={(event) =>
                      setReceiptForm({ ...receiptForm, amount: event.target.value })
                    }
                  />
                </label>
                <label>
                  {t('finance.field.currency')}
                  <Input
                    value={receiptForm.currency}
                    onChange={(event) =>
                      setReceiptForm({ ...receiptForm, currency: event.target.value })
                    }
                  />
                </label>
                <label>
                  {t('finance.receipt.field.receiptType')}
                  <FormSelect
                    value={receiptForm.receipt_type}
                    onChange={(event) =>
                      setReceiptForm({ ...receiptForm, receipt_type: event.target.value })
                    }
                  >
                    {receiptTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.labelKey)}
                      </option>
                    ))}
                  </FormSelect>
                </label>
              </div>
              <label>
                {t('finance.receipt.field.bankAccount')}
                <Input
                  value={receiptForm.bank_account}
                  onChange={(event) =>
                    setReceiptForm({ ...receiptForm, bank_account: event.target.value })
                  }
                />
              </label>
              <label>
                {t('finance.receipt.field.referenceNo')}
                <Input
                  value={receiptForm.reference_no}
                  onChange={(event) =>
                    setReceiptForm({ ...receiptForm, reference_no: event.target.value })
                  }
                />
              </label>
              <label>
                {t('finance.receipt.field.remark')}
                <Input.TextArea
                  rows={2}
                  value={receiptForm.remark}
                  onChange={(event) =>
                    setReceiptForm({ ...receiptForm, remark: event.target.value })
                  }
                />
              </label>
              <div className="modal-actions">
                <button
                  className="secondary-inline"
                  type="button"
                  onClick={() => setReceiptModalOpen(false)}
                >
                  {t('finance.receipt.action.cancel')}
                </button>
                <button className="inline-submit" disabled={submittingReceipt} type="submit">
                  {t('finance.receipt.action.submitReceipt')}
                </button>
              </div>
            </form>
          </Modal>
        ) : null}

        {detailId ? (
          <section className="workspace-panel finance-receipt-detail-panel">
            <PanelTitle icon={<CheckCircle2 size={18} />} title={t('finance.receipt.panel.claimAndAllocation')} />
            {selectedReceipt ? (
              <>
                <dl className="detail-list finance-receipt-detail-list">
                  <div>
                    <dt>{t('finance.receipt.field.currentReceipt')}</dt>
                    <dd>{selectedReceipt.receipt_no}</dd>
                  </div>
                  <div>
                    <dt>{t('finance.field.status')}</dt>
                    <dd>{receiptStatusLabel(selectedReceipt.status)}</dd>
                  </div>
                  <div>
                    <dt>{t('finance.receipt.field.allocatedAmount')}</dt>
                    <dd>
                      {formatFinanceAmount(
                        selectedReceipt.allocated_amount,
                        selectedReceipt.currency,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('finance.receipt.field.unallocatedAmount')}</dt>
                    <dd>
                      {formatFinanceAmount(
                        selectedReceipt.unallocated_amount,
                        selectedReceipt.currency,
                      )}
                    </dd>
                  </div>
                </dl>
                <div className="finance-receipt-actions">
                  <form className="record-form compact-section" onSubmit={submitClaim}>
                    <div className="form-divider">{t('finance.receipt.panel.claim')}</div>
                    <div className="form-pair two">
                      <label>
                        {t('finance.receipt.field.claimedAt')}
                        <Input
                          type="date"
                          value={claimForm.claimed_at}
                          onChange={(event) =>
                            setClaimForm({ ...claimForm, claimed_at: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        {t('finance.receipt.field.salesUserId')}
                        <Input
                          value={claimForm.sales_user_id}
                          onChange={(event) =>
                            setClaimForm({ ...claimForm, sales_user_id: event.target.value })
                          }
                        />
                      </label>
                    </div>
                    <label>
                      {t('finance.receipt.field.salesUserName')}
                      <Input
                        value={claimForm.sales_user_name}
                        onChange={(event) =>
                          setClaimForm({ ...claimForm, sales_user_name: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      {t('finance.receipt.field.claimNote')}
                      <Input
                        value={claimForm.note}
                        onChange={(event) =>
                          setClaimForm({ ...claimForm, note: event.target.value })
                        }
                      />
                    </label>
                    <Button
                      htmlType="submit"
                      icon={<CheckCircle2 size={16} />}
                      loading={submittingClaim}
                      disabled={!selectedReceiptCanClaim}
                    >
                      {t('finance.receipt.action.confirmClaim')}
                    </Button>
                  </form>

                  <form className="record-form compact-section" onSubmit={submitAllocation}>
                    <div className="form-divider">{t('finance.receipt.panel.allocation')}</div>
                    <div className="form-pair two">
                      <label>
                        {t('finance.receipt.field.allocationType')}
                        <FormSelect
                          value={allocationForm.allocation_type}
                          onChange={(event) =>
                            setAllocationForm({
                              ...allocationForm,
                              allocation_type: event.target.value,
                            })
                          }
                        >
                          {allocationTypeOptions.map((item) => (
                            <option key={item.value} value={item.value}>
                              {t(item.labelKey)}
                            </option>
                          ))}
                        </FormSelect>
                      </label>
                      <label>
                        {t('finance.receipt.field.allocatedAt')}
                        <Input
                          type="date"
                          value={allocationForm.allocated_at}
                          onChange={(event) =>
                            setAllocationForm({
                              ...allocationForm,
                              allocated_at: event.target.value,
                            })
                          }
                        />
                      </label>
                    </div>
                    <div className="form-pair two">
                      <label>
                        {t('finance.receipt.field.contractId')}
                        <Input
                          value={allocationForm.contract_id}
                          onChange={(event) =>
                            setAllocationForm({
                              ...allocationForm,
                              contract_id: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label>
                        {t('finance.receipt.field.contractNo')}
                        <Input
                          value={allocationForm.contract_no}
                          onChange={(event) =>
                            setAllocationForm({
                              ...allocationForm,
                              contract_no: event.target.value,
                            })
                          }
                        />
                      </label>
                    </div>
                    <div className="form-pair three">
                      <label>
                        {t('finance.receipt.field.invoiceNo')}
                        <Input
                          value={allocationForm.invoice_no}
                          onChange={(event) =>
                            setAllocationForm({
                              ...allocationForm,
                              invoice_no: event.target.value,
                            })
                          }
                        />
                      </label>
                      <label>
                        {t('finance.receipt.field.allocationAmount')}
                        <Input
                          value={allocationForm.amount}
                          onChange={(event) =>
                            setAllocationForm({ ...allocationForm, amount: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        {t('finance.field.currency')}
                        <Input
                          value={allocationForm.currency}
                          onChange={(event) =>
                            setAllocationForm({ ...allocationForm, currency: event.target.value })
                          }
                        />
                      </label>
                    </div>
                    <label>
                      {t('finance.receipt.field.allocationRemark')}
                      <Input
                        value={allocationForm.remark}
                        onChange={(event) =>
                          setAllocationForm({ ...allocationForm, remark: event.target.value })
                        }
                      />
                    </label>
                    <Button
                      htmlType="submit"
                      icon={<Save size={16} />}
                      loading={submittingAllocation}
                      disabled={!selectedReceiptCanAllocate}
                    >
                      {t('finance.receipt.action.saveAllocation')}
                    </Button>
                  </form>
                </div>
                {selectedReceipt.allocations.length > 0 ? (
                  <section className="finance-allocation-history">
                    <strong>{t('finance.receipt.panel.allocationHistory')}</strong>
                    <Table<BankReceipt['allocations'][number]>
                      columns={[
                        {
                          title: t('finance.receipt.table.type'),
                          dataIndex: 'allocation_type',
                          render: allocationTypeLabel,
                        },
                        { title: t('finance.receipt.table.contractNo'), dataIndex: 'contract_no', render: nullableText },
                        { title: t('finance.receipt.field.invoiceNo'), dataIndex: 'invoice_no', render: nullableText },
                        {
                          title: t('finance.field.amount'),
                          dataIndex: 'amount',
                          render: (value: string, record) =>
                            formatFinanceAmount(value, record.currency),
                        },
                        { title: t('finance.receipt.table.date'), dataIndex: 'allocated_at', render: formatDate },
                      ]}
                      dataSource={selectedReceipt.allocations}
                      pagination={false}
                      rowKey="id"
                      size="small"
                    />
                  </section>
                ) : null}
              </>
            ) : (
              <div className="module-state">{t('finance.receipt.message.noReceipt')}</div>
            )}
          </section>
        ) : null}

        {!detailId ? (
          <section className="workspace-panel finance-receivable-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<ShieldCheck size={18} />} title={t('finance.receipt.panel.receivables')} />
              <form
                className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadReceivables()
                }}
              >
                <label>
                  {t('finance.receipt.filter.receivableSearch')}
                  <Input
                    value={receivableSearch}
                    placeholder={t('finance.receipt.filter.receivableSearchPlaceholder')}
                    onChange={(event) => setReceivableSearch(event.target.value)}
                  />
                </label>
                <label>
                  {t('finance.receipt.field.contractNo')}
                  <Input
                    value={receivableContractFilter}
                    onChange={(event) => setReceivableContractFilter(event.target.value)}
                  />
                </label>
                <label>
                  {t('finance.receipt.field.invoiceNo')}
                  <Input
                    value={receivableInvoiceFilter}
                    onChange={(event) => setReceivableInvoiceFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  {t('finance.receipt.action.search')}
                </Button>
              </form>
            </div>
            <Table<ReceivableItem>
              columns={[
                {
                  title: t('finance.receipt.table.exportContract'),
                  dataIndex: 'contract_no',
                  render: (value: string) => <strong>{value}</strong>,
                },
                { title: t('finance.receipt.table.customer'), dataIndex: 'customer_name' },
                { title: t('finance.receipt.table.salesUser'), dataIndex: 'sales_user_name', render: nullableText },
                {
                  title: t('finance.receipt.table.contractAmount'),
                  dataIndex: 'total_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.receipt.table.receivedAmount'),
                  dataIndex: 'received_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.receipt.table.receivableBalance'),
                  dataIndex: 'receivable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                { title: t('finance.field.status'), dataIndex: 'status', render: receivableStatusTag },
              ]}
              dataSource={receivables}
              loading={loadingReceivables}
              pagination={false}
              rowKey="contract_id"
              size="small"
            />
          </section>
        ) : null}
      </section>
    </section>
  )
}
