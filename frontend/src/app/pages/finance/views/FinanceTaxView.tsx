import { Button, Input, Table } from 'antd'
import { ArrowLeft, Save, ShieldCheck, Search } from 'lucide-react'
import type { VerificationDocument, VerificationUsageItem } from '../../../../api'
import { verificationDocumentStatusOptions, verificationReminderStatusOptions } from '../../../../shared/formOptions'
import { FormSelect, PanelTitle } from '../../../../shared/ui'
import { formatFinanceAmount, formatDate, nullableText } from '../../appHelpers'
import {
  customsReceiptPayload,
  initialCustomsReceiptForm,
  initialTaxRefundForm,
  initialVerificationDocumentForm,
  initialVerificationRegisterForm,
  taxRefundPayload,
  verificationDocumentPayload,
  verificationDocumentStatusTag,
  verificationDocumentStatusLabel,
  verificationReminderStatusTag,
  verificationReminderStatusLabel,
  verificationRegisterPayload,
} from '../financeHelpers'
import type { FinancePageContext } from '../financeHelpers'

export function FinanceTaxView({ ctx }: { ctx: FinancePageContext }) {
  const {
    detailId, moduleHeader, moduleAlerts, goModule, goDetail,
    verificationDocuments, verificationUsage,
    selectedVerificationDocument,
    selectedVerificationCanRegisterCustoms, selectedVerificationCanVerify, selectedVerificationCanRefund,
    verificationSearch, setVerificationSearch, verificationStatusFilter, setVerificationStatusFilter,
    verificationReminderFilter, setVerificationReminderFilter, verificationOwnerFilter, setVerificationOwnerFilter,
    verificationShipmentFilter, setVerificationShipmentFilter,
    verificationUsageSearch, setVerificationUsageSearch, verificationUsageStatusFilter, setVerificationUsageStatusFilter,
    verificationUsageReminderFilter, setVerificationUsageReminderFilter, verificationUsageShipmentFilter, setVerificationUsageShipmentFilter,
    verificationDocumentForm, setVerificationDocumentForm,
    customsReceiptForm, setCustomsReceiptForm,
    verificationRegisterForm, setVerificationRegisterForm,
    taxRefundForm, setTaxRefundForm,
    submittingVerificationDocument, submittingCustomsReceipt, submittingVerificationRegister, submittingTaxRefund,
    submitVerificationDocument, submitCustomsReceipt, submitVerificationRegister, submitTaxRefund,
    loadVerificationDocuments, loadVerificationUsage,
    loadingVerificationDocuments, loadingVerificationUsage,
  } = ctx
  return (
    <section className={detailId ? 'finance-page finance-detail-page' : 'finance-page'}>
      {detailId ? (
        <div className="finance-subnav">
          <button className="finance-back-button" type="button" onClick={() => goModule('tax')}>
            <ArrowLeft size={16} />
            核销退税
          </button>
        </div>
      ) : (
        moduleHeader
      )}
      {moduleAlerts}
      <section
        className={detailId ? 'finance-detail-grid' : 'finance-tax-grid'}
        aria-label="核销退税"
      >
      {!detailId ? (
      <section className="workspace-panel finance-tax-list-panel">
        <div className="panel-heading toolbar-heading">
          <PanelTitle icon={<ShieldCheck size={18} />} title="核销单列表" />
          <form
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadVerificationDocuments()
            }}
          >
            <label>
              搜索
              <Input value={verificationSearch} onChange={(event) => setVerificationSearch(event.target.value)} />
            </label>
            <label>
              状态
              <FormSelect value={verificationStatusFilter} onChange={(event) => setVerificationStatusFilter(event.target.value)}>
                <option value="">全部</option>
                {verificationDocumentStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </FormSelect>
            </label>
            <label>
              提醒状态
              <FormSelect value={verificationReminderFilter} onChange={(event) => setVerificationReminderFilter(event.target.value)}>
                <option value="">全部</option>
                {verificationReminderStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </FormSelect>
            </label>
            <label>
              持有人标识
              <Input value={verificationOwnerFilter} onChange={(event) => setVerificationOwnerFilter(event.target.value)} />
            </label>
            <label>
              出货单号
              <Input value={verificationShipmentFilter} onChange={(event) => setVerificationShipmentFilter(event.target.value)} />
            </label>
            <Button htmlType="submit" icon={<Search size={16} />}>查询</Button>
          </form>
        </div>
        <Table<VerificationDocument>
          columns={[
            {
              title: '核销单号',
              dataIndex: 'document_no',
              render: (value: string) => <button className="row-button" type="button">{value}</button>,
            },
            { title: '状态', dataIndex: 'status', render: verificationDocumentStatusTag },
            { title: '提醒', dataIndex: 'reminder_status', render: verificationReminderStatusTag },
            { title: '持有人', dataIndex: 'owner_user_name', render: nullableText },
            { title: '出货单', dataIndex: 'shipment_no', render: nullableText },
            { title: '客户', dataIndex: 'customer_name', render: nullableText },
            {
              title: '可退金额',
              dataIndex: 'refundable_amount',
              render: (value: string, record) => formatFinanceAmount(value, record.currency),
            },
            {
              title: '已退金额',
              dataIndex: 'refunded_amount',
              render: (value: string, record) => formatFinanceAmount(value, record.currency),
            },
            { title: '有效期', dataIndex: 'valid_until', render: formatDate },
          ]}
          dataSource={verificationDocuments}
          loading={loadingVerificationDocuments}
          pagination={false}
          rowClassName={(record) => (record.id === selectedVerificationDocument?.id ? 'selected-row' : '')}
          rowKey="id"
          size="small"
          onRow={(record) => ({
            onClick: () => goDetail('tax', record.id),
          })}
        />
      </section>
      ) : null}

      {!detailId ? (
      <section className="workspace-panel finance-tax-form-panel">
        <PanelTitle icon={<ShieldCheck size={18} />} title="领用核销单" />
        <form className="record-form" onSubmit={submitVerificationDocument}>
          <div className="form-pair two">
            <label>
              核销单号
              <Input value={verificationDocumentForm.document_no} onChange={(event) => setVerificationDocumentForm({ ...verificationDocumentForm, document_no: event.target.value })} />
            </label>
            <label>
              领用日期
              <Input type="date" value={verificationDocumentForm.received_at} onChange={(event) => setVerificationDocumentForm({ ...verificationDocumentForm, received_at: event.target.value })} />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              持有人标识
              <Input value={verificationDocumentForm.owner_user_id} onChange={(event) => setVerificationDocumentForm({ ...verificationDocumentForm, owner_user_id: event.target.value })} />
            </label>
            <label>
              持有人姓名
              <Input value={verificationDocumentForm.owner_user_name} onChange={(event) => setVerificationDocumentForm({ ...verificationDocumentForm, owner_user_name: event.target.value })} />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              出货单标识
              <Input value={verificationDocumentForm.shipment_plan_id} onChange={(event) => setVerificationDocumentForm({ ...verificationDocumentForm, shipment_plan_id: event.target.value })} />
            </label>
            <label>
              出货单号
              <Input value={verificationDocumentForm.shipment_no} onChange={(event) => setVerificationDocumentForm({ ...verificationDocumentForm, shipment_no: event.target.value })} />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              客户名称
              <Input value={verificationDocumentForm.customer_name} onChange={(event) => setVerificationDocumentForm({ ...verificationDocumentForm, customer_name: event.target.value })} />
            </label>
            <label>
              币种
              <Input value={verificationDocumentForm.currency} onChange={(event) => setVerificationDocumentForm({ ...verificationDocumentForm, currency: event.target.value })} />
            </label>
          </div>
          <div className="form-pair two">
            <label>
              可退金额
              <Input value={verificationDocumentForm.refundable_amount} onChange={(event) => setVerificationDocumentForm({ ...verificationDocumentForm, refundable_amount: event.target.value })} />
            </label>
            <label>
              有效期
              <Input type="date" value={verificationDocumentForm.valid_until} onChange={(event) => setVerificationDocumentForm({ ...verificationDocumentForm, valid_until: event.target.value })} />
            </label>
          </div>
          <label>
            备注
            <Input value={verificationDocumentForm.remark} onChange={(event) => setVerificationDocumentForm({ ...verificationDocumentForm, remark: event.target.value })} />
          </label>
          <Button htmlType="submit" icon={<Save size={16} />} loading={submittingVerificationDocument}>
            领用核销单
          </Button>
        </form>
      </section>
      ) : null}

      {selectedVerificationDocument ? (
        <section className="workspace-panel finance-tax-detail-panel">
          <PanelTitle icon={<ShieldCheck size={18} />} title={`核销单 ${selectedVerificationDocument.document_no}`} />
          <dl className="detail-list">
            <div><dt>状态</dt><dd>{verificationDocumentStatusTag(selectedVerificationDocument.status)}</dd></div>
            <div><dt>提醒</dt><dd>{verificationReminderStatusTag(selectedVerificationDocument.reminder_status)}</dd></div>
            <div><dt>持有人</dt><dd>{selectedVerificationDocument.owner_user_name ?? '-'}</dd></div>
            <div><dt>出货单</dt><dd>{selectedVerificationDocument.shipment_no ?? '-'}</dd></div>
            <div><dt>客户</dt><dd>{selectedVerificationDocument.customer_name ?? '-'}</dd></div>
            <div><dt>可退金额</dt><dd>{formatFinanceAmount(selectedVerificationDocument.refundable_amount, selectedVerificationDocument.currency)}</dd></div>
            <div><dt>已退金额</dt><dd>{formatFinanceAmount(selectedVerificationDocument.refunded_amount, selectedVerificationDocument.currency)}</dd></div>
            <div><dt>未退金额</dt><dd>{formatFinanceAmount(selectedVerificationDocument.unrefunded_amount, selectedVerificationDocument.currency)}</dd></div>
            <div><dt>有效期</dt><dd>{formatDate(selectedVerificationDocument.valid_until)}</dd></div>
            <div><dt>报关回单</dt><dd>{selectedVerificationDocument.customs_receipt_no ?? '未登记'}</dd></div>
            <div><dt>核销日期</dt><dd>{formatDate(selectedVerificationDocument.verified_at)}</dd></div>
            <div><dt>退税日期</dt><dd>{formatDate(selectedVerificationDocument.refunded_at)}</dd></div>
            <div><dt>备注</dt><dd>{selectedVerificationDocument.remark ?? '-'}</dd></div>
          </dl>
          <div className="finance-tax-actions">
            <form className="record-form" onSubmit={submitCustomsReceipt}>
              <PanelTitle icon={<ShieldCheck size={18} />} title="登记报关回单" />
              <div className="form-pair two">
                <label>
                  海关编号
                  <Input value={customsReceiptForm.customs_declaration_no} onChange={(event) => setCustomsReceiptForm({ ...customsReceiptForm, customs_declaration_no: event.target.value })} />
                </label>
                <label>
                  报关回单号
                  <Input value={customsReceiptForm.customs_receipt_no} onChange={(event) => setCustomsReceiptForm({ ...customsReceiptForm, customs_receipt_no: event.target.value })} />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  回单日期
                  <Input type="date" value={customsReceiptForm.received_at} onChange={(event) => setCustomsReceiptForm({ ...customsReceiptForm, received_at: event.target.value })} />
                </label>
                <label>
                  备注
                  <Input value={customsReceiptForm.remark} onChange={(event) => setCustomsReceiptForm({ ...customsReceiptForm, remark: event.target.value })} />
                </label>
              </div>
              <Button
                htmlType="submit"
                icon={<Save size={16} />}
                loading={submittingCustomsReceipt}
                disabled={!selectedVerificationCanRegisterCustoms}
              >
                登记报关回单
              </Button>
            </form>

            <form className="record-form" onSubmit={submitVerificationRegister}>
              <PanelTitle icon={<ShieldCheck size={18} />} title="核销登记" />
              <div className="form-pair two">
                <label>
                  核销日期
                  <Input type="date" value={verificationRegisterForm.verified_at} onChange={(event) => setVerificationRegisterForm({ ...verificationRegisterForm, verified_at: event.target.value })} />
                </label>
                <label>
                  核销金额
                  <Input value={verificationRegisterForm.amount} onChange={(event) => setVerificationRegisterForm({ ...verificationRegisterForm, amount: event.target.value })} />
                </label>
              </div>
              <label>
                备注
                <Input value={verificationRegisterForm.remark} onChange={(event) => setVerificationRegisterForm({ ...verificationRegisterForm, remark: event.target.value })} />
              </label>
              <Button
                htmlType="submit"
                icon={<ShieldCheck size={16} />}
                loading={submittingVerificationRegister}
                disabled={!selectedVerificationCanVerify}
              >
                核销登记
              </Button>
            </form>

            <form className="record-form" onSubmit={submitTaxRefund}>
              <PanelTitle icon={<ShieldCheck size={18} />} title="退税登记" />
              <div className="form-pair two">
                <label>
                  退税日期
                  <Input type="date" value={taxRefundForm.refunded_at} onChange={(event) => setTaxRefundForm({ ...taxRefundForm, refunded_at: event.target.value })} />
                </label>
                <label>
                  退税金额
                  <Input value={taxRefundForm.amount} onChange={(event) => setTaxRefundForm({ ...taxRefundForm, amount: event.target.value })} />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  币种
                  <Input value={taxRefundForm.currency} onChange={(event) => setTaxRefundForm({ ...taxRefundForm, currency: event.target.value })} />
                </label>
                <label>
                  备注
                  <Input value={taxRefundForm.remark} onChange={(event) => setTaxRefundForm({ ...taxRefundForm, remark: event.target.value })} />
                </label>
              </div>
              <Button
                htmlType="submit"
                icon={<Save size={16} />}
                loading={submittingTaxRefund}
                disabled={!selectedVerificationCanRefund}
              >
                退税登记
              </Button>
            </form>
          </div>
        </section>
      ) : null}

      {!detailId ? (
      <section className="workspace-panel finance-tax-usage-panel">
        <div className="panel-heading toolbar-heading">
          <PanelTitle icon={<ShieldCheck size={18} />} title="核销单使用情况" />
          <form
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadVerificationUsage()
            }}
          >
            <label>
              搜索
              <Input value={verificationUsageSearch} onChange={(event) => setVerificationUsageSearch(event.target.value)} />
            </label>
            <label>
              状态
              <FormSelect value={verificationUsageStatusFilter} onChange={(event) => setVerificationUsageStatusFilter(event.target.value)}>
                <option value="">全部</option>
                {verificationDocumentStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </FormSelect>
            </label>
            <label>
              提醒状态
              <FormSelect value={verificationUsageReminderFilter} onChange={(event) => setVerificationUsageReminderFilter(event.target.value)}>
                <option value="">全部</option>
                {verificationReminderStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </FormSelect>
            </label>
            <label>
              出货单号
              <Input value={verificationUsageShipmentFilter} onChange={(event) => setVerificationUsageShipmentFilter(event.target.value)} />
            </label>
            <Button htmlType="submit" icon={<Search size={16} />}>查询</Button>
          </form>
        </div>
        <Table<VerificationUsageItem>
          columns={[
            { title: '核销单号', dataIndex: 'document_no', render: (value: string) => <strong>{value}</strong> },
            { title: '状态', dataIndex: 'status', render: verificationDocumentStatusTag },
            { title: '提醒', dataIndex: 'reminder_status', render: verificationReminderStatusTag },
            { title: '持有人', dataIndex: 'owner_user_name', render: nullableText },
            { title: '出货单', dataIndex: 'shipment_no', render: nullableText },
            {
              title: '可退金额',
              dataIndex: 'refundable_amount',
              render: (value: string, record) => formatFinanceAmount(value, record.currency),
            },
            {
              title: '已退金额',
              dataIndex: 'refunded_amount',
              render: (value: string, record) => formatFinanceAmount(value, record.currency),
            },
          ]}
          dataSource={verificationUsage}
          loading={loadingVerificationUsage}
          pagination={false}
          rowKey="document_id"
          size="small"
        />
      </section>
      ) : null}
      </section>
    </section>
  )
}
