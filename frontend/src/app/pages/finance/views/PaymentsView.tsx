import { Alert, Button, Input, Modal, Table } from 'antd'
import { ArrowLeft, Plus, Search, CheckCircle2, Save, ShieldCheck } from 'lucide-react'
import {
  type PayableItem,
  type SupplierInvoice,
  type SupplierPaymentRequest,
} from '../../../../api'
import { FormSelect, PanelTitle } from '../../../../shared/ui'
import { supplierInvoiceStatusOptions, paymentTypeOptions } from '../../../../shared/formOptions'
import { formatFinanceAmount, nullableText } from '../../appHelpers'
import {
  initialPaymentRequestForm,
  initialPaymentApprovalForm,
  supplierInvoiceStatusLabel,
  supplierInvoiceStatusTag,
  paymentRequestStatusTag,
  paymentTypeLabel,
} from '../financeHelpers'
import { ApprovalAssigneeSelect } from '../../../components/ApprovalAssigneeSelect'
import type { PaymentsModel } from '../hooks/usePaymentsModule'
import type { FinanceViewShell } from '../financePageTypes'

type Props = {
  model: PaymentsModel
  shell: FinanceViewShell
}

export function PaymentsView({ model, shell }: Props) {
  const {
    invoiceContractFilter,
    invoiceModalOpen,
    invoiceSearch,
    invoiceStatusFilter,
    invoiceSupplierFilter,
    loadPayables,
    loadSupplierInvoices,
    loadingPayables,
    loadingPaymentRequests,
    loadingSupplierInvoices,
    payableContractFilter,
    payableSearch,
    payableStatusFilter,
    payableSupplierFilter,
    payables,
    paymentApprovalForm,
    paymentRequestForm,
    paymentRequests,
    selectedPaymentRequest,
    selectedPaymentRequestCanApprove,
    selectedSupplierInvoice,
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
    submitPaymentApproval,
    submitPaymentRequest,
    submitSupplierInvoice,
    submittingPaymentApproval,
    submittingPaymentRequest,
    submittingSupplierInvoice,
    supplierInvoiceForm,
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
            付款管理
          </button>
        </div>
      ) : (
        moduleHeader
      )}
      {moduleAlerts}
      <section
        className={detailId ? 'finance-detail-grid' : 'finance-payment-grid'}
        aria-label="付款管理"
      >
        {!detailId ? (
          <section className="workspace-panel finance-payment-list-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle icon={<Search size={18} />} title="供应商发票列表" />
              <form
                className="inline-filters single-line-filter-toolbar"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadSupplierInvoices()
                }}
              >
                <label>
                  发票搜索
                  <Input
                    value={invoiceSearch}
                    onChange={(event) => setInvoiceSearch(event.target.value)}
                  />
                </label>
                <label>
                  付款状态
                  <FormSelect
                    value={invoiceStatusFilter}
                    onChange={(event) => setInvoiceStatusFilter(event.target.value)}
                  >
                    <option value="">全部状态</option>
                    {supplierInvoiceStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  供应商标识
                  <Input
                    value={invoiceSupplierFilter}
                    onChange={(event) => setInvoiceSupplierFilter(event.target.value)}
                  />
                </label>
                <label>
                  采购合同号
                  <Input
                    value={invoiceContractFilter}
                    onChange={(event) => setInvoiceContractFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  查询
                </Button>
                <Button
                  type="primary"
                  icon={<Plus size={16} />}
                  onClick={() => setInvoiceModalOpen(true)}
                >
                  发票登记
                </Button>
              </form>
            </div>
            <Table<SupplierInvoice>
              columns={[
                {
                  title: '供应商发票',
                  dataIndex: 'invoice_no',
                  render: (value: string) => (
                    <button className="row-button" type="button">
                      {value}
                    </button>
                  ),
                },
                { title: '状态', dataIndex: 'status', render: supplierInvoiceStatusTag },
                { title: '供应商', dataIndex: 'supplier_name' },
                { title: '采购合同', dataIndex: 'purchase_contract_no', render: nullableText },
                {
                  title: '发票金额',
                  dataIndex: 'total_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '未付',
                  dataIndex: 'unpaid_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
              ]}
              dataSource={supplierInvoices}
              loading={loadingSupplierInvoices}
              pagination={false}
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
            title="供应商发票登记"
            width={760}
            onCancel={() => setInvoiceModalOpen(false)}
          >
            <form
              className="record-form"
              onSubmit={(e) => {
                submitSupplierInvoice(e)
                setInvoiceModalOpen(false)
              }}
            >
              <div className="form-pair two">
                <label>
                  供应商发票号
                  <Input
                    value={supplierInvoiceForm.invoice_no}
                    onChange={(event) =>
                      setSupplierInvoiceForm({
                        ...supplierInvoiceForm,
                        invoice_no: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  发票日期
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
                  供应商标识
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
                  供应商名称
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
                  开票通知标识
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
                  开票通知编号
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
                  采购合同标识
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
                  采购合同号
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
                  发票金额
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
                  币种
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
                  到期日
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
                备注
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
                  取消
                </button>
                <button
                  className="inline-submit"
                  disabled={submittingSupplierInvoice}
                  type="submit"
                >
                  登记供应商发票
                </button>
              </div>
            </form>
          </Modal>
        ) : null}

        {detailId ? (
          <section className="workspace-panel finance-payment-request-panel">
            <PanelTitle icon={<CheckCircle2 size={18} />} title="付款申请和审批" />
            {selectedSupplierInvoice ? (
              <dl className="detail-list finance-payment-detail-list">
                <div>
                  <dt>当前发票</dt>
                  <dd>{selectedSupplierInvoice.invoice_no}</dd>
                </div>
                <div>
                  <dt>状态</dt>
                  <dd>{supplierInvoiceStatusLabel(selectedSupplierInvoice.status)}</dd>
                </div>
                <div>
                  <dt>已付</dt>
                  <dd>
                    {formatFinanceAmount(
                      selectedSupplierInvoice.paid_amount,
                      selectedSupplierInvoice.currency,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>未付</dt>
                  <dd>
                    {formatFinanceAmount(
                      selectedSupplierInvoice.unpaid_amount,
                      selectedSupplierInvoice.currency,
                    )}
                  </dd>
                </div>
              </dl>
            ) : (
              <div className="module-state">暂无供应商发票</div>
            )}
            <div className="finance-receipt-actions">
              <form className="record-form compact-section" onSubmit={submitPaymentRequest}>
                <div className="form-divider">付款申请新增</div>
                <div className="finance-payment-fields">
                  <label>
                    付款申请号
                    <Input
                      value={paymentRequestForm.request_no}
                      onChange={(event) =>
                        setPaymentRequestForm({
                          ...paymentRequestForm,
                          request_no: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    供应商发票标识
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
                    付款类别
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
                          {item.label}
                        </option>
                      ))}
                    </FormSelect>
                  </label>
                  <label>
                    申请日期
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
                    申请金额
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
                    币种
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
                    申请备注
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
                  新增付款申请
                </Button>
              </form>
              <form className="record-form compact-section" onSubmit={submitPaymentApproval}>
                <div className="form-divider">付款审批</div>
                <div className="finance-payment-fields">
                  <label>
                    审批金额
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
                    审批日期
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
                    审批人
                    <Input disabled value={selectedPaymentRequest?.reviewer_name ?? ''} />
                  </label>
                  <label>
                    付款账号
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
                    审批备注
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
                  审批付款
                </Button>
                {selectedPaymentRequest?.status === 'submitted' &&
                !selectedPaymentRequestCanApprove ? (
                  <Alert
                    showIcon
                    type="info"
                    message={`等待 ${selectedPaymentRequest.reviewer_name ?? '指定审批人'} 审批`}
                  />
                ) : null}
              </form>
            </div>
            <section className="finance-allocation-history">
              <strong>付款申请列表</strong>
              <Table<SupplierPaymentRequest>
                columns={[
                  {
                    title: '申请号',
                    dataIndex: 'request_no',
                    render: (value: string) => (
                      <button className="row-button" type="button">
                        {value}
                      </button>
                    ),
                  },
                  { title: '状态', dataIndex: 'status', render: paymentRequestStatusTag },
                  { title: '类别', dataIndex: 'payment_type', render: paymentTypeLabel },
                  { title: '供应商', dataIndex: 'supplier_name' },
                  { title: '发票号', dataIndex: 'supplier_invoice_no' },
                  {
                    title: '申请金额',
                    dataIndex: 'requested_amount',
                    render: (value: string, record) => formatFinanceAmount(value, record.currency),
                  },
                  {
                    title: '已付',
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
              <PanelTitle icon={<ShieldCheck size={18} />} title="应付账款查询" />
              <form
                className="inline-filters single-line-filter-toolbar"
                onSubmit={(event) => {
                  event.preventDefault()
                  void loadPayables()
                }}
              >
                <label>
                  应付搜索
                  <Input
                    value={payableSearch}
                    onChange={(event) => setPayableSearch(event.target.value)}
                  />
                </label>
                <label>
                  应付状态
                  <FormSelect
                    value={payableStatusFilter}
                    onChange={(event) => setPayableStatusFilter(event.target.value)}
                  >
                    <option value="">全部状态</option>
                    {supplierInvoiceStatusOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </FormSelect>
                </label>
                <label>
                  供应商标识
                  <Input
                    value={payableSupplierFilter}
                    onChange={(event) => setPayableSupplierFilter(event.target.value)}
                  />
                </label>
                <label>
                  采购合同号
                  <Input
                    value={payableContractFilter}
                    onChange={(event) => setPayableContractFilter(event.target.value)}
                  />
                </label>
                <Button htmlType="submit" icon={<Search size={16} />}>
                  查询
                </Button>
              </form>
            </div>
            <Table<PayableItem>
              columns={[
                {
                  title: '供应商发票',
                  dataIndex: 'invoice_no',
                  render: (value: string) => <strong>{value}</strong>,
                },
                { title: '供应商', dataIndex: 'supplier_name' },
                { title: '采购合同', dataIndex: 'purchase_contract_no', render: nullableText },
                {
                  title: '发票金额',
                  dataIndex: 'total_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '已付款',
                  dataIndex: 'paid_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: '应付余额',
                  dataIndex: 'payable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                { title: '状态', dataIndex: 'status', render: supplierInvoiceStatusTag },
              ]}
              dataSource={payables}
              loading={loadingPayables}
              pagination={false}
              rowKey="supplier_invoice_id"
              size="small"
            />
          </section>
        ) : null}
      </section>
    </section>
  )
}
