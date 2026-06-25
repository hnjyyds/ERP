import { Button, Input, Table } from 'antd'
import { ArrowLeft, Handshake, Save, ShieldCheck, Search } from 'lucide-react'
import type { FeePayableItem, FeePaymentRequest, PartnerFeeInvoice } from '../../../../api'
import { feePaymentRequestStatusOptions, partnerFeeInvoiceStatusOptions } from '../../../../shared/formOptions'
import { FormSelect, PanelTitle } from '../../../../shared/ui'
import { formatFinanceAmount, nullableText } from '../../appHelpers'
import {
  feePaymentRequestStatusTag,
  feeTypeLabel,
  initialFeePaymentApprovalForm,
  initialFeePaymentRequestForm,
  feePaymentApprovalPayload,
  feePaymentRequestPayload,
  partnerFeeInvoicePayload,
  partnerFeeInvoiceStatusTag,
} from '../financeHelpers'
import type { FinancePageContext } from '../financeHelpers'

export function FinanceFeesView({ ctx }: { ctx: FinancePageContext }) {
  const {
    detailId, moduleHeader, moduleAlerts, goModule, goDetail,
    partnerFeeInvoices, feePaymentRequests, feePayables,
    selectedPartnerFeeInvoice, selectedFeePaymentRequest,
    selectedFeePaymentRequestId, setSelectedFeePaymentRequestId,
    selectedFeePaymentRequestCanApprove,
    feeInvoiceSearch, setFeeInvoiceSearch, feeInvoiceStatusFilter, setFeeInvoiceStatusFilter,
    feeInvoiceTypeFilter, setFeeInvoiceTypeFilter, feeInvoicePartnerFilter, setFeeInvoicePartnerFilter,
    feeInvoiceShipmentFilter, setFeeInvoiceShipmentFilter,
    feePaymentRequestSearch, setFeePaymentRequestSearch,
    feePaymentRequestStatusFilter, setFeePaymentRequestStatusFilter,
    feePaymentRequestTypeFilter, setFeePaymentRequestTypeFilter,
    feePayableSearch, setFeePayableSearch, feePayableStatusFilter, setFeePayableStatusFilter,
    feePayableTypeFilter, setFeePayableTypeFilter, feePayablePartnerFilter, setFeePayablePartnerFilter,
    feePayableShipmentFilter, setFeePayableShipmentFilter,
    partnerFeeInvoiceForm, setPartnerFeeInvoiceForm,
    feePaymentRequestForm, setFeePaymentRequestForm,
    feePaymentApprovalForm, setFeePaymentApprovalForm,
    submittingPartnerFeeInvoice, submittingFeePaymentRequest, submittingFeePaymentApproval,
    submitPartnerFeeInvoice, submitFeePaymentRequest, submitFeePaymentApproval,
    loadPartnerFeeInvoices, loadFeePaymentRequests, loadFeePayables,
    loadingPartnerFeeInvoices, loadingFeePaymentRequests, loadingFeePayables,
  } = ctx
  return (
    <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
      {detailId ? (
        <div className="finance-subnav">
          <button className="finance-back-button" type="button" onClick={() => goModule('fees')}>
            <ArrowLeft size={16} />
            付费管理
          </button>
        </div>
      ) : (
        moduleHeader
      )}
      {moduleAlerts}
      <section
        className={detailId ? 'finance-detail-grid' : 'finance-fee-grid'}
        aria-label="付费管理"
      >
      {!detailId ? (
      <section className="workspace-panel finance-fee-list-panel">
        <div className="panel-heading toolbar-heading">
          <PanelTitle icon={<Handshake size={18} />} title="合作伙伴费用发票" />
          <form
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadPartnerFeeInvoices()
            }}
          >
            <label>
              搜索
              <Input value={feeInvoiceSearch} onChange={(event) => setFeeInvoiceSearch(event.target.value)} />
            </label>
            <label>
              状态
              <FormSelect value={feeInvoiceStatusFilter} onChange={(event) => setFeeInvoiceStatusFilter(event.target.value)}>
                <option value="">全部</option>
                {partnerFeeInvoiceStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </FormSelect>
            </label>
            <label>
              费用类型
              <FormSelect value={feeInvoiceTypeFilter} onChange={(event) => setFeeInvoiceTypeFilter(event.target.value)}>
                <option value="">全部</option>
                <option value="freight">运费</option>
                <option value="commission">佣金</option>
                <option value="other">其他</option>
              </FormSelect>
            </label>
            <label>
              伙伴标识
              <Input value={feeInvoicePartnerFilter} onChange={(event) => setFeeInvoicePartnerFilter(event.target.value)} />
            </label>
            <label>
              出货单号
              <Input value={feeInvoiceShipmentFilter} onChange={(event) => setFeeInvoiceShipmentFilter(event.target.value)} />
            </label>
            <Button htmlType="submit" icon={<Search size={16} />}>查询</Button>
          </form>
        </div>
        <Table<PartnerFeeInvoice>
          columns={[
            {
              title: '发票号',
              dataIndex: 'invoice_no',
              render: (value: string) => <button className="row-button" type="button">{value}</button>,
            },
            { title: '状态', dataIndex: 'status', render: partnerFeeInvoiceStatusTag },
            { title: '伙伴', dataIndex: 'partner_name' },
            { title: '费用类型', dataIndex: 'fee_type', render: feeTypeLabel },
            { title: '出货单', dataIndex: 'shipment_no', render: nullableText },
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
          dataSource={partnerFeeInvoices}
          loading={loadingPartnerFeeInvoices}
          pagination={false}
          rowClassName={(record) => (record.id === selectedPartnerFeeInvoice?.id ? 'selected-row' : '')}
          rowKey="id"
          size="small"
          onRow={(record) => ({
            onClick: () => {
              setSelectedFeePaymentRequestId(null)
              goDetail('fees', record.id)
            },
          })}
        />
      </section>
      ) : null}

      {!detailId ? (
      <section className="workspace-panel finance-fee-form-panel">
        <PanelTitle icon={<Handshake size={18} />} title="登记费用发票" />
        <form className="record-form" onSubmit={submitPartnerFeeInvoice}>
          <div className="form-pair two">
            <label>
              发票号
              <Input value={partnerFeeInvoiceForm.invoice_no} onChange={(event) => setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, invoice_no: event.target.value })} />
            </label>
            <label>
              发票日期
              <Input type="date" value={partnerFeeInvoiceForm.invoice_date} onChange={(event) => setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, invoice_date: event.target.value })} />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              伙伴标识
              <Input value={partnerFeeInvoiceForm.partner_id} onChange={(event) => setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, partner_id: event.target.value })} />
            </label>
            <label>
              伙伴名称
              <Input value={partnerFeeInvoiceForm.partner_name} onChange={(event) => setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, partner_name: event.target.value })} />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              伙伴类型
              <Input value={partnerFeeInvoiceForm.partner_type} onChange={(event) => setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, partner_type: event.target.value })} />
            </label>
            <label>
              出货单标识
              <Input value={partnerFeeInvoiceForm.shipment_plan_id} onChange={(event) => setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, shipment_plan_id: event.target.value })} />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              出货单号
              <Input value={partnerFeeInvoiceForm.shipment_no} onChange={(event) => setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, shipment_no: event.target.value })} />
            </label>
            <label>
              业务员标识
              <Input value={partnerFeeInvoiceForm.sales_user_id} onChange={(event) => setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, sales_user_id: event.target.value })} />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              业务员姓名
              <Input value={partnerFeeInvoiceForm.sales_user_name} onChange={(event) => setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, sales_user_name: event.target.value })} />
            </label>
            <label>
              费用类型
              <FormSelect value={partnerFeeInvoiceForm.fee_type} onChange={(event) => setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, fee_type: event.target.value })}>
                <option value="">请选择</option>
                <option value="freight">运费</option>
                <option value="commission">佣金</option>
                <option value="other">其他</option>
              </FormSelect>
            </label>
          </div>
          <div className="form-pair two">
            <label>
              发票金额
              <Input value={partnerFeeInvoiceForm.total_amount} onChange={(event) => setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, total_amount: event.target.value })} />
            </label>
            <label>
              币种
              <Input value={partnerFeeInvoiceForm.currency} onChange={(event) => setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, currency: event.target.value })} />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              到期日
              <Input type="date" value={partnerFeeInvoiceForm.due_date} onChange={(event) => setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, due_date: event.target.value })} />
            </label>
            <label>
              备注
              <Input value={partnerFeeInvoiceForm.remark} onChange={(event) => setPartnerFeeInvoiceForm({ ...partnerFeeInvoiceForm, remark: event.target.value })} />
            </label>
          </div>
          <Button htmlType="submit" icon={<Save size={16} />} loading={submittingPartnerFeeInvoice}>
            登记费用发票
          </Button>
        </form>
      </section>
      ) : null}

      {selectedPartnerFeeInvoice ? (
        <section className="workspace-panel finance-fee-detail-panel">
          <PanelTitle icon={<Handshake size={18} />} title={`费用发票 ${selectedPartnerFeeInvoice.invoice_no}`} />
          <dl className="detail-list">
            <div><dt>状态</dt><dd>{partnerFeeInvoiceStatusTag(selectedPartnerFeeInvoice.status)}</dd></div>
            <div><dt>伙伴</dt><dd>{selectedPartnerFeeInvoice.partner_name}</dd></div>
            <div><dt>费用类型</dt><dd>{feeTypeLabel(selectedPartnerFeeInvoice.fee_type)}</dd></div>
            <div><dt>出货单</dt><dd>{selectedPartnerFeeInvoice.shipment_no ?? '-'}</dd></div>
            <div><dt>发票金额</dt><dd>{formatFinanceAmount(selectedPartnerFeeInvoice.total_amount, selectedPartnerFeeInvoice.currency)}</dd></div>
            <div><dt>未付</dt><dd>{formatFinanceAmount(selectedPartnerFeeInvoice.unpaid_amount, selectedPartnerFeeInvoice.currency)}</dd></div>
            <div><dt>业务员</dt><dd>{selectedPartnerFeeInvoice.sales_user_name ?? '-'}</dd></div>
            <div><dt>备注</dt><dd>{selectedPartnerFeeInvoice.remark ?? '-'}</dd></div>
          </dl>
          <div className="finance-fee-actions">
            <form className="record-form" onSubmit={submitFeePaymentRequest}>
              <PanelTitle icon={<Save size={18} />} title="新增付费申请" />
              <div className="form-pair two">
                <label>
                  申请号
                  <Input value={feePaymentRequestForm.request_no} onChange={(event) => setFeePaymentRequestForm({ ...feePaymentRequestForm, request_no: event.target.value })} />
                </label>
                <label>
                  申请日期
                  <Input type="date" value={feePaymentRequestForm.request_date} onChange={(event) => setFeePaymentRequestForm({ ...feePaymentRequestForm, request_date: event.target.value })} />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  申请金额
                  <Input value={feePaymentRequestForm.requested_amount} onChange={(event) => setFeePaymentRequestForm({ ...feePaymentRequestForm, requested_amount: event.target.value })} />
                </label>
                <label>
                  币种
                  <Input value={feePaymentRequestForm.currency} onChange={(event) => setFeePaymentRequestForm({ ...feePaymentRequestForm, currency: event.target.value })} />
                </label>
              </div>
              <label>
                备注
                <Input value={feePaymentRequestForm.remark} onChange={(event) => setFeePaymentRequestForm({ ...feePaymentRequestForm, remark: event.target.value })} />
              </label>
              <Button htmlType="submit" icon={<Save size={16} />} loading={submittingFeePaymentRequest}>
                提交付费申请
              </Button>
            </form>

            <form className="record-form" onSubmit={submitFeePaymentApproval}>
              <PanelTitle icon={<ShieldCheck size={18} />} title="审批付费申请" />
              <div className="form-pair two">
                <label>
                  审批金额
                  <Input value={feePaymentApprovalForm.approved_amount} onChange={(event) => setFeePaymentApprovalForm({ ...feePaymentApprovalForm, approved_amount: event.target.value })} />
                </label>
                <label>
                  审批日期
                  <Input type="date" value={feePaymentApprovalForm.approved_at} onChange={(event) => setFeePaymentApprovalForm({ ...feePaymentApprovalForm, approved_at: event.target.value })} />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  审批人
                  <Input value={feePaymentApprovalForm.reviewer_name} onChange={(event) => setFeePaymentApprovalForm({ ...feePaymentApprovalForm, reviewer_name: event.target.value })} />
                </label>
                <label>
                  付款账号
                  <Input value={feePaymentApprovalForm.payment_account} onChange={(event) => setFeePaymentApprovalForm({ ...feePaymentApprovalForm, payment_account: event.target.value })} />
                </label>
              </div>
              <label>
                备注
                <Input value={feePaymentApprovalForm.remark} onChange={(event) => setFeePaymentApprovalForm({ ...feePaymentApprovalForm, remark: event.target.value })} />
              </label>
              <Button
                htmlType="submit"
                icon={<ShieldCheck size={16} />}
                loading={submittingFeePaymentApproval}
                disabled={!selectedFeePaymentRequestCanApprove}
              >
                审批通过
              </Button>
            </form>
          </div>
          <section className="finance-fee-history">
            <strong>付费申请列表</strong>
            <Table<FeePaymentRequest>
              columns={[
                {
                  title: '申请号',
                  dataIndex: 'request_no',
                  render: (value: string) => <button className="row-button" type="button">{value}</button>,
                },
                { title: '状态', dataIndex: 'status', render: feePaymentRequestStatusTag },
                { title: '费用类型', dataIndex: 'fee_type', render: feeTypeLabel },
                { title: '伙伴', dataIndex: 'partner_name' },
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
              dataSource={feePaymentRequests}
              loading={loadingFeePaymentRequests}
              pagination={false}
              rowClassName={(record) => (record.id === selectedFeePaymentRequest?.id ? 'selected-row' : '')}
              rowKey="id"
              size="small"
              onRow={(record) => ({
                onClick: () => {
                  setSelectedFeePaymentRequestId(record.id)
                  setFeePaymentApprovalForm(initialFeePaymentApprovalForm(record.requested_amount))
                },
              })}
            />
          </section>
        </section>
      ) : null}

      {!detailId ? (
      <section className="workspace-panel finance-fee-payable-panel">
        <div className="panel-heading toolbar-heading">
          <PanelTitle icon={<ShieldCheck size={18} />} title="应付费用查询" />
          <form
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadFeePayables()
            }}
          >
            <label>
              搜索
              <Input value={feePayableSearch} onChange={(event) => setFeePayableSearch(event.target.value)} />
            </label>
            <label>
              状态
              <FormSelect value={feePayableStatusFilter} onChange={(event) => setFeePayableStatusFilter(event.target.value)}>
                <option value="">全部</option>
                {partnerFeeInvoiceStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </FormSelect>
            </label>
            <label>
              费用类型
              <FormSelect value={feePayableTypeFilter} onChange={(event) => setFeePayableTypeFilter(event.target.value)}>
                <option value="">全部</option>
                <option value="freight">运费</option>
                <option value="commission">佣金</option>
                <option value="other">其他</option>
              </FormSelect>
            </label>
            <label>
              伙伴标识
              <Input value={feePayablePartnerFilter} onChange={(event) => setFeePayablePartnerFilter(event.target.value)} />
            </label>
            <label>
              出货单号
              <Input value={feePayableShipmentFilter} onChange={(event) => setFeePayableShipmentFilter(event.target.value)} />
            </label>
            <Button htmlType="submit" icon={<Search size={16} />}>查询</Button>
          </form>
        </div>
        <Table<FeePayableItem>
          columns={[
            { title: '发票号', dataIndex: 'invoice_no', render: (value: string) => <strong>{value}</strong> },
            { title: '伙伴', dataIndex: 'partner_name' },
            { title: '费用类型', dataIndex: 'fee_type', render: feeTypeLabel },
            { title: '出货单', dataIndex: 'shipment_no', render: nullableText },
            {
              title: '发票金额',
              dataIndex: 'total_amount',
              render: (value: string, record) => formatFinanceAmount(value, record.currency),
            },
            {
              title: '已付',
              dataIndex: 'paid_amount',
              render: (value: string, record) => formatFinanceAmount(value, record.currency),
            },
            {
              title: '应付余额',
              dataIndex: 'payable_amount',
              render: (value: string, record) => formatFinanceAmount(value, record.currency),
            },
            { title: '状态', dataIndex: 'status', render: partnerFeeInvoiceStatusTag },
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
