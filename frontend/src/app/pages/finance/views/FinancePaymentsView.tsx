import { Button, Input, Table } from 'antd'
import { ArrowLeft, Coins, Save, ShieldCheck, Search, Wallet } from 'lucide-react'
import type { PayableItem, SupplierInvoice, SupplierPaymentRequest } from '../../../../api'
import { supplierInvoiceStatusOptions } from '../../../../shared/formOptions'
import { FormSelect, PanelTitle } from '../../../../shared/ui'
import { formatDate, formatFinanceAmount, nullableText } from '../../appHelpers'
import {
  initialPaymentApprovalForm,
  initialPaymentRequestForm,
  paymentApprovalPayload,
  paymentRequestPayload,
  paymentRequestStatusTag,
  paymentTypeLabel,
  supplierInvoicePayload,
  supplierInvoiceStatusTag,
} from '../financeHelpers'
import type { FinancePageContext } from '../financeHelpers'

export function FinancePaymentsView({ ctx }: { ctx: FinancePageContext }) {
  const {
    setSelectedSupplierInvoiceId,
    detailId, moduleHeader, moduleAlerts, goModule, goDetail,
    supplierInvoices, paymentRequests, payables,
    selectedSupplierInvoice, selectedPaymentRequest,
    selectedPaymentRequestId, setSelectedPaymentRequestId,
    selectedPaymentRequestCanApprove,
    invoiceSearch, setInvoiceSearch, invoiceStatusFilter, setInvoiceStatusFilter,
    invoiceSupplierFilter, setInvoiceSupplierFilter, invoiceContractFilter, setInvoiceContractFilter,
    paymentRequestSearch, setPaymentRequestSearch, paymentRequestStatusFilter, setPaymentRequestStatusFilter,
    paymentRequestTypeFilter, setPaymentRequestTypeFilter,
    payableSearch, setPayableSearch, payableStatusFilter, setPayableStatusFilter,
    payableSupplierFilter, setPayableSupplierFilter, payableContractFilter, setPayableContractFilter,
    supplierInvoiceForm, setSupplierInvoiceForm,
    paymentRequestForm, setPaymentRequestForm,
    paymentApprovalForm, setPaymentApprovalForm,
    submittingSupplierInvoice, submittingPaymentRequest, submittingPaymentApproval,
    submitSupplierInvoice, submitPaymentRequest, submitPaymentApproval,
    loadSupplierInvoices, loadPaymentRequests, loadPayables,
    loadingSupplierInvoices, loadingPaymentRequests, loadingPayables,
  } = ctx
  return (
    <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
      {detailId ? (
        <div className="finance-subnav">
          <button className="finance-back-button" type="button" onClick={() => goModule('payments')}>
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
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadSupplierInvoices()
            }}
          >
            <label>
              发票搜索
              <Input value={invoiceSearch} onChange={(event) => setInvoiceSearch(event.target.value)} />
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
          rowClassName={(record) => (record.id === selectedSupplierInvoice?.id ? 'selected-row' : '')}
          rowKey="id"
          size="small"
          onRow={(record) => ({
            onClick: () => {
              setSelectedSupplierInvoiceId(record.id)
              setPaymentRequestForm(initialPaymentRequestForm(record))
              setPaymentApprovalForm(initialPaymentApprovalForm(record.unpaid_amount))
              goDetail('payments', record.id)
            },
          })}
        />
      </section>
      ) : null}

      {!detailId ? (
      <section className="workspace-panel finance-payment-form-panel">
        <PanelTitle icon={<Wallet size={18} />} title="供应商发票登记" />
        <form className="record-form" onSubmit={submitSupplierInvoice}>
          <div className="form-pair two">
            <label>
              供应商发票号
              <Input
                value={supplierInvoiceForm.invoice_no}
                onChange={(event) =>
                  setSupplierInvoiceForm({ ...supplierInvoiceForm, invoice_no: event.target.value })
                }
              />
            </label>
            <label>
              发票日期
              <Input
                type="date"
                value={supplierInvoiceForm.invoice_date}
                onChange={(event) =>
                  setSupplierInvoiceForm({ ...supplierInvoiceForm, invoice_date: event.target.value })
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
                  setSupplierInvoiceForm({ ...supplierInvoiceForm, supplier_id: event.target.value })
                }
              />
            </label>
            <label>
              供应商名称
              <Input
                value={supplierInvoiceForm.supplier_name}
                onChange={(event) =>
                  setSupplierInvoiceForm({ ...supplierInvoiceForm, supplier_name: event.target.value })
                }
              />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              采购发票通知标识
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
              采购发票通知编号
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
                  setSupplierInvoiceForm({ ...supplierInvoiceForm, purchase_contract_id: event.target.value })
                }
              />
            </label>
            <label>
              采购合同号
              <Input
                value={supplierInvoiceForm.purchase_contract_no}
                onChange={(event) =>
                  setSupplierInvoiceForm({ ...supplierInvoiceForm, purchase_contract_no: event.target.value })
                }
              />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              发票金额
              <Input
                value={supplierInvoiceForm.total_amount}
                onChange={(event) =>
                  setSupplierInvoiceForm({ ...supplierInvoiceForm, total_amount: event.target.value })
                }
              />
            </label>
            <label>
              币种
              <Input
                value={supplierInvoiceForm.currency}
                onChange={(event) =>
                  setSupplierInvoiceForm({ ...supplierInvoiceForm, currency: event.target.value })
                }
              />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              到期日
              <Input
                type="date"
                value={supplierInvoiceForm.due_date}
                onChange={(event) =>
                  setSupplierInvoiceForm({ ...supplierInvoiceForm, due_date: event.target.value })
                }
              />
            </label>
            <label>
              备注
              <Input
                value={supplierInvoiceForm.remark}
                onChange={(event) =>
                  setSupplierInvoiceForm({ ...supplierInvoiceForm, remark: event.target.value })
                }
              />
            </label>
          </div>
          <Button htmlType="submit" icon={<Save size={16} />} loading={submittingSupplierInvoice}>
            登记供应商发票
          </Button>
        </form>
      </section>
      ) : null}

      {selectedSupplierInvoice ? (
        <section className="workspace-panel finance-payment-detail-panel">
          <PanelTitle icon={<Coins size={18} />} title={`发票 ${selectedSupplierInvoice.invoice_no}`} />
          <dl className="detail-list">
            <div><dt>状态</dt><dd>{supplierInvoiceStatusTag(selectedSupplierInvoice.status)}</dd></div>
            <div><dt>供应商</dt><dd>{selectedSupplierInvoice.supplier_name}</dd></div>
            <div><dt>采购合同</dt><dd>{selectedSupplierInvoice.purchase_contract_no ?? '-'}</dd></div>
            <div><dt>发票金额</dt><dd>{formatFinanceAmount(selectedSupplierInvoice.total_amount, selectedSupplierInvoice.currency)}</dd></div>
            <div><dt>未付</dt><dd>{formatFinanceAmount(selectedSupplierInvoice.unpaid_amount, selectedSupplierInvoice.currency)}</dd></div>
            <div><dt>发票日期</dt><dd>{formatDate(selectedSupplierInvoice.invoice_date)}</dd></div>
            <div><dt>到期日</dt><dd>{formatDate(selectedSupplierInvoice.due_date)}</dd></div>
            <div><dt>备注</dt><dd>{selectedSupplierInvoice.remark ?? '-'}</dd></div>
          </dl>
          <div className="finance-payment-actions">
            <form className="record-form" onSubmit={submitPaymentRequest}>
              <PanelTitle icon={<Coins size={18} />} title="新增付款申请" />
              <div className="form-pair two">
                <label>
                  申请号
                  <Input
                    value={paymentRequestForm.request_no}
                    onChange={(event) =>
                      setPaymentRequestForm({ ...paymentRequestForm, request_no: event.target.value })
                    }
                  />
                </label>
                <label>
                  付款类型
                  <FormSelect
                    value={paymentRequestForm.payment_type}
                    onChange={(event) =>
                      setPaymentRequestForm({ ...paymentRequestForm, payment_type: event.target.value })
                    }
                  >
                    <option value="">请选择</option>
                    <option value="tt">T/T</option>
                    <option value="lc">L/C</option>
                    <option value="cash">现金</option>
                  </FormSelect>
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  申请日期
                  <Input
                    type="date"
                    value={paymentRequestForm.request_date}
                    onChange={(event) =>
                      setPaymentRequestForm({ ...paymentRequestForm, request_date: event.target.value })
                    }
                  />
                </label>
                <label>
                  申请金额
                  <Input
                    value={paymentRequestForm.requested_amount}
                    onChange={(event) =>
                      setPaymentRequestForm({ ...paymentRequestForm, requested_amount: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  币种
                  <Input
                    value={paymentRequestForm.currency}
                    onChange={(event) =>
                      setPaymentRequestForm({ ...paymentRequestForm, currency: event.target.value })
                    }
                  />
                </label>
                <label>
                  备注
                  <Input
                    value={paymentRequestForm.remark}
                    onChange={(event) =>
                      setPaymentRequestForm({ ...paymentRequestForm, remark: event.target.value })
                    }
                  />
                </label>
              </div>
              <Button htmlType="submit" icon={<Save size={16} />} loading={submittingPaymentRequest}>
                提交付款申请
              </Button>
            </form>

            <form className="record-form" onSubmit={submitPaymentApproval}>
              <PanelTitle icon={<ShieldCheck size={18} />} title="审批付款申请" />
              <div className="form-pair two">
                <label>
                  审批金额
                  <Input
                    value={paymentApprovalForm.approved_amount}
                    onChange={(event) =>
                      setPaymentApprovalForm({ ...paymentApprovalForm, approved_amount: event.target.value })
                    }
                  />
                </label>
                <label>
                  审批日期
                  <Input
                    type="date"
                    value={paymentApprovalForm.approved_at}
                    onChange={(event) =>
                      setPaymentApprovalForm({ ...paymentApprovalForm, approved_at: event.target.value })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  审批人
                  <Input
                    value={paymentApprovalForm.reviewer_name}
                    onChange={(event) =>
                      setPaymentApprovalForm({ ...paymentApprovalForm, reviewer_name: event.target.value })
                    }
                  />
                </label>
                <label>
                  付款账号
                  <Input
                    value={paymentApprovalForm.payment_account}
                    onChange={(event) =>
                      setPaymentApprovalForm({ ...paymentApprovalForm, payment_account: event.target.value })
                    }
                  />
                </label>
              </div>
              <label>
                备注
                <Input
                  value={paymentApprovalForm.remark}
                  onChange={(event) =>
                    setPaymentApprovalForm({ ...paymentApprovalForm, remark: event.target.value })
                  }
                />
              </label>
              <Button
                htmlType="submit"
                icon={<ShieldCheck size={16} />}
                loading={submittingPaymentApproval}
                disabled={!selectedPaymentRequestCanApprove}
              >
                审批通过
              </Button>
            </form>
          </div>
          <section className="finance-payment-history">
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
              rowClassName={(record) => (record.id === selectedPaymentRequest?.id ? 'selected-row' : '')}
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => {
                  setSelectedPaymentRequestId(record.id)
                  setPaymentApprovalForm(initialPaymentApprovalForm(record.requested_amount))
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
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadPayables()
            }}
          >
            <label>
              应付搜索
              <Input value={payableSearch} onChange={(event) => setPayableSearch(event.target.value)} />
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
            { title: '供应商发票', dataIndex: 'invoice_no', render: (value: string) => <strong>{value}</strong> },
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
