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
            收款管理
          </button>
        </div>
      ) : (
        moduleHeader
      )}
      {moduleAlerts}
      <section
        className={detailId ? 'finance-detail-grid' : 'finance-receipt-grid'}
        aria-label="收款管理"
      >
        {!detailId ? (
          <section className="workspace-panel finance-receipt-list-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<Search size={18} />} title="银行水单列表" />
              <form
                className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadReceipts()
                }}
              >
                <label>
                  水单搜索
                  <Input
                    value={receiptSearch}
                    placeholder="水单号 / 付款人 / 客户"
                    onChange={(event) => setReceiptSearch(event.target.value)}
                  />
                </label>
                <label>
                  水单状态
                  <FormSelect
                    value={receiptStatusFilter}
                    onChange={(event) => setReceiptStatusFilter(event.target.value)}
                  >
                    <option value="">全部状态</option>
                    {receiptStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  客户标识
                  <Input
                    value={receiptCustomerFilter}
                    placeholder="输入客户编号或名称"
                    onChange={(event) => setReceiptCustomerFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  查询
                </Button>
                <Button
                  type="primary"
                  icon={<Plus size={16} />}
                  onClick={() => setReceiptModalOpen(true)}
                >
                  水单录入
                </Button>
              </form>
            </div>

            <div className="finance-receipt-strip">
              <span>本次列表 {receipts.length} 条</span>
              <strong>
                {formatFinanceAmount(totalReceiptAmount.toFixed(2), receipts[0]?.currency ?? 'USD')}
              </strong>
              <span>
                未分摊{' '}
                {formatFinanceAmount(
                  totalUnallocatedAmount.toFixed(2),
                  receipts[0]?.currency ?? 'USD',
                )}
              </span>
            </div>

            <Table<BankReceipt>
              columns={[
                {
                  title: '水单号',
                  dataIndex: 'receipt_no',
                  render: (value: string) => (
                    <button className="row-button" type="button">
                      {value}
                    </button>
                  ),
                },
                { title: '状态', dataIndex: 'status', render: receiptStatusTag },
                { title: '性质', dataIndex: 'receipt_type', render: receiptTypeLabel },
                { title: '收款日', dataIndex: 'received_at', render: formatDate },
                { title: '付款人', dataIndex: 'payer_name' },
                { title: '客户', dataIndex: 'customer_name', render: nullableText },
                {
                  title: '金额',
                  dataIndex: 'amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '未分摊',
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
            title="水单录入"
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
                  银行水单号
                  <Input
                    value={receiptForm.receipt_no}
                    onChange={(event) =>
                      setReceiptForm({ ...receiptForm, receipt_no: event.target.value })
                    }
                  />
                </label>
                <label>
                  收款日期
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
                付款人
                <Input
                  value={receiptForm.payer_name}
                  onChange={(event) =>
                    setReceiptForm({ ...receiptForm, payer_name: event.target.value })
                  }
                />
              </label>
              <div className="form-pair two">
                <label>
                  客户标识
                  <Input
                    value={receiptForm.customer_id}
                    onChange={(event) =>
                      setReceiptForm({ ...receiptForm, customer_id: event.target.value })
                    }
                  />
                </label>
                <label>
                  客户名称
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
                  收款金额
                  <Input
                    value={receiptForm.amount}
                    onChange={(event) =>
                      setReceiptForm({ ...receiptForm, amount: event.target.value })
                    }
                  />
                </label>
                <label>
                  币种
                  <Input
                    value={receiptForm.currency}
                    onChange={(event) =>
                      setReceiptForm({ ...receiptForm, currency: event.target.value })
                    }
                  />
                </label>
                <label>
                  收款性质
                  <FormSelect
                    value={receiptForm.receipt_type}
                    onChange={(event) =>
                      setReceiptForm({ ...receiptForm, receipt_type: event.target.value })
                    }
                  >
                    {receiptTypeOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </FormSelect>
                </label>
              </div>
              <label>
                收款银行账号
                <Input
                  value={receiptForm.bank_account}
                  onChange={(event) =>
                    setReceiptForm({ ...receiptForm, bank_account: event.target.value })
                  }
                />
              </label>
              <label>
                银行流水号
                <Input
                  value={receiptForm.reference_no}
                  onChange={(event) =>
                    setReceiptForm({ ...receiptForm, reference_no: event.target.value })
                  }
                />
              </label>
              <label>
                备注
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
                  取消
                </button>
                <button className="inline-submit" disabled={submittingReceipt} type="submit">
                  保存水单
                </button>
              </div>
            </form>
          </Modal>
        ) : null}

        {detailId ? (
          <section className="workspace-panel finance-receipt-detail-panel">
            <PanelTitle icon={<CheckCircle2 size={18} />} title="认领和分摊" />
            {selectedReceipt ? (
              <>
                <dl className="detail-list finance-receipt-detail-list">
                  <div>
                    <dt>当前水单</dt>
                    <dd>{selectedReceipt.receipt_no}</dd>
                  </div>
                  <div>
                    <dt>状态</dt>
                    <dd>{receiptStatusLabel(selectedReceipt.status)}</dd>
                  </div>
                  <div>
                    <dt>已分摊</dt>
                    <dd>
                      {formatFinanceAmount(
                        selectedReceipt.allocated_amount,
                        selectedReceipt.currency,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>未分摊</dt>
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
                    <div className="form-divider">水单认领</div>
                    <div className="form-pair two">
                      <label>
                        认领日期
                        <Input
                          type="date"
                          value={claimForm.claimed_at}
                          onChange={(event) =>
                            setClaimForm({ ...claimForm, claimed_at: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        业务员标识
                        <Input
                          value={claimForm.sales_user_id}
                          onChange={(event) =>
                            setClaimForm({ ...claimForm, sales_user_id: event.target.value })
                          }
                        />
                      </label>
                    </div>
                    <label>
                      业务员姓名
                      <Input
                        value={claimForm.sales_user_name}
                        onChange={(event) =>
                          setClaimForm({ ...claimForm, sales_user_name: event.target.value })
                        }
                      />
                    </label>
                    <label>
                      认领说明
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
                      确认认领
                    </Button>
                  </form>

                  <form className="record-form compact-section" onSubmit={submitAllocation}>
                    <div className="form-divider">收款分摊</div>
                    <div className="form-pair two">
                      <label>
                        分摊类型
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
                              {item.label}
                            </option>
                          ))}
                        </FormSelect>
                      </label>
                      <label>
                        分摊日期
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
                        出口合同标识
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
                        出口合同号
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
                        发票号
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
                        分摊金额
                        <Input
                          value={allocationForm.amount}
                          onChange={(event) =>
                            setAllocationForm({ ...allocationForm, amount: event.target.value })
                          }
                        />
                      </label>
                      <label>
                        币种
                        <Input
                          value={allocationForm.currency}
                          onChange={(event) =>
                            setAllocationForm({ ...allocationForm, currency: event.target.value })
                          }
                        />
                      </label>
                    </div>
                    <label>
                      分摊备注
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
                      保存分摊
                    </Button>
                  </form>
                </div>
                {selectedReceipt.allocations.length > 0 ? (
                  <section className="finance-allocation-history">
                    <strong>分摊记录</strong>
                    <Table<BankReceipt['allocations'][number]>
                      columns={[
                        {
                          title: '类型',
                          dataIndex: 'allocation_type',
                          render: allocationTypeLabel,
                        },
                        { title: '合同号', dataIndex: 'contract_no', render: nullableText },
                        { title: '发票号', dataIndex: 'invoice_no', render: nullableText },
                        {
                          title: '金额',
                          dataIndex: 'amount',
                          render: (value: string, record) =>
                            formatFinanceAmount(value, record.currency),
                        },
                        { title: '日期', dataIndex: 'allocated_at', render: formatDate },
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
              <div className="module-state">暂无银行水单</div>
            )}
          </section>
        ) : null}

        {!detailId ? (
          <section className="workspace-panel finance-receivable-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<ShieldCheck size={18} />} title="应收账款查询" />
              <form
                className="inline-filters"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadReceivables()
                }}
              >
                <label>
                  应收搜索
                  <Input
                    value={receivableSearch}
                    placeholder="合同号 / 客户 / 报价号"
                    onChange={(event) => setReceivableSearch(event.target.value)}
                  />
                </label>
                <label>
                  出口合同号
                  <Input
                    value={receivableContractFilter}
                    onChange={(event) => setReceivableContractFilter(event.target.value)}
                  />
                </label>
                <label>
                  发票号
                  <Input
                    value={receivableInvoiceFilter}
                    onChange={(event) => setReceivableInvoiceFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  查询
                </Button>
              </form>
            </div>
            <Table<ReceivableItem>
              columns={[
                {
                  title: '出口合同',
                  dataIndex: 'contract_no',
                  render: (value: string) => <strong>{value}</strong>,
                },
                { title: '客户', dataIndex: 'customer_name' },
                { title: '业务员', dataIndex: 'sales_user_name', render: nullableText },
                {
                  title: '合同金额',
                  dataIndex: 'total_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '已收款',
                  dataIndex: 'received_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '应收余额',
                  dataIndex: 'receivable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                { title: '状态', dataIndex: 'status', render: receivableStatusTag },
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
