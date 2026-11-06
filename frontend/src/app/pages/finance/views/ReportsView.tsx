import { Button, Descriptions, Input, Table } from 'antd'
import { Search, ChevronRight, FileSpreadsheet } from 'lucide-react'
import {
  type ReceiptUsageDetailRow,
  type BankReceiptCurrencySummary,
  type GoodsPaymentQueryRow,
  type FeePaymentQueryRow,
  type CustomsReceiptCollectionRow,
  type TaxRefundCurrencyTotal,
} from '../../../../api'
import { FormSelect, PanelTitle } from '../../../../shared/ui'
import { formatFinanceAmount, nullableText } from '../../appHelpers'
import type { ReportsModel } from '../hooks/useReportsModule'
import type { FinanceViewShell } from '../financePageTypes'

type Props = {
  model: ReportsModel
  shell: FinanceViewShell
}

export function ReportsView({ model, shell }: Props) {
  const {
    activeReport,
    bankReceiptSummaryReport,
    customsCollectionReport,
    exportFinanceReport,
    exportingReport,
    feePaymentReport,
    goodsPaymentReport,
    loadFinanceReport,
    loadingReport,
    openFinanceReportDrilldown,
    receiptUsageReport,
    reportCurrency,
    reportDateFrom,
    reportDateTo,
    reportDrilldown,
    reportFeeType,
    reportIncludeRegistered,
    reportOwnerUserId,
    reportPartnerName,
    reportReceiptNo,
    reportReceiptType,
    reportReminderStatus,
    reportSalesUserId,
    reportStatus,
    reportSupplierName,
    setActiveReport,
    setReportCurrency,
    setReportDateFrom,
    setReportDateTo,
    setReportFeeType,
    setReportIncludeRegistered,
    setReportOwnerUserId,
    setReportPartnerName,
    setReportReceiptNo,
    setReportReceiptType,
    setReportReminderStatus,
    setReportSalesUserId,
    setReportStatus,
    setReportSupplierName,
    taxRefundStatisticsReport,
  } = model
  const { moduleAlerts, moduleHeader } = shell

  const reportTabs: { key: string; label: string }[] = [
    { key: 'receipt-usage', label: '水单使用明细' },
    { key: 'bank-receipt-summary', label: '银行水单汇总' },
    { key: 'goods-payment', label: '货款支付情况' },
    { key: 'fee-payment', label: '费用支付情况' },
    { key: 'customs-receipt-collection', label: '报关回单催收' },
    { key: 'tax-refund-statistics', label: '申报退税统计' },
  ]
  return (
    <section className="finance-page">
      {moduleHeader}
      {moduleAlerts}
      <section className="workspace-panel" aria-label="财务统计报表">
        <div className="panel-heading toolbar-heading">
          <PanelTitle icon={<FileSpreadsheet size={18} />} title="财务统计报表" />
          <form
            aria-label="财务报表筛选"
            className="inline-filters single-line-filter-toolbar"
            onSubmit={(event) => {
              event.preventDefault()
              void loadFinanceReport(activeReport)
            }}
          >
            <label>
              起始日期
              <Input
                type="date"
                value={reportDateFrom}
                onChange={(event) => setReportDateFrom(event.target.value)}
              />
            </label>
            <label>
              结束日期
              <Input
                type="date"
                value={reportDateTo}
                onChange={(event) => setReportDateTo(event.target.value)}
              />
            </label>
            <label>
              币种
              <Input
                value={reportCurrency}
                placeholder="如 USD"
                onChange={(event) => setReportCurrency(event.target.value)}
              />
            </label>
            {activeReport === 'receipt-usage' ? (
              <label>
                水单号
                <Input
                  value={reportReceiptNo}
                  onChange={(event) => setReportReceiptNo(event.target.value)}
                />
              </label>
            ) : null}
            {activeReport === 'bank-receipt-summary' ? (
              <label>
                收款性质
                <FormSelect
                  value={reportReceiptType}
                  onChange={(event) => setReportReceiptType(event.target.value)}
                >
                  <option value="">全部</option>
                  <option value="advance">预收</option>
                  <option value="normal">普通</option>
                  <option value="tax_refund">退税</option>
                </FormSelect>
              </label>
            ) : null}
            {activeReport === 'goods-payment' ? (
              <label>
                供应商
                <Input
                  value={reportSupplierName}
                  onChange={(event) => setReportSupplierName(event.target.value)}
                />
              </label>
            ) : null}
            {activeReport === 'fee-payment' ? (
              <>
                <label>
                  合作伙伴
                  <Input
                    value={reportPartnerName}
                    onChange={(event) => setReportPartnerName(event.target.value)}
                  />
                </label>
                <label>
                  费用类型
                  <Input
                    value={reportFeeType}
                    onChange={(event) => setReportFeeType(event.target.value)}
                  />
                </label>
                <label>
                  业务员
                  <Input
                    value={reportSalesUserId}
                    onChange={(event) => setReportSalesUserId(event.target.value)}
                  />
                </label>
              </>
            ) : null}
            {activeReport === 'customs-receipt-collection' ? (
              <>
                <label>
                  业务员
                  <Input
                    value={reportOwnerUserId}
                    onChange={(event) => setReportOwnerUserId(event.target.value)}
                  />
                </label>
                <label>
                  催收状态
                  <FormSelect
                    value={reportReminderStatus}
                    onChange={(event) => setReportReminderStatus(event.target.value)}
                  >
                    <option value="">全部</option>
                    <option value="pending">待处理</option>
                    <option value="done">已完成</option>
                    <option value="overdue">已逾期</option>
                  </FormSelect>
                </label>
                <label>
                  包含已登记
                  <input
                    aria-label="包含已登记"
                    checked={reportIncludeRegistered}
                    type="checkbox"
                    onChange={(event) => setReportIncludeRegistered(event.target.checked)}
                  />
                </label>
              </>
            ) : null}
            {['goods-payment', 'fee-payment', 'tax-refund-statistics'].includes(activeReport) ? (
              <label>
                状态
                <Input
                  value={reportStatus}
                  onChange={(event) => setReportStatus(event.target.value)}
                />
              </label>
            ) : null}
            <Button htmlType="submit" icon={<Search size={16} />} loading={loadingReport}>
              查询
            </Button>
            <Button
              htmlType="button"
              icon={<FileSpreadsheet size={16} />}
              loading={exportingReport}
              onClick={() => void exportFinanceReport(activeReport)}
            >
              导出 CSV
            </Button>
          </form>
        </div>

        <nav className="finance-tab-rail" aria-label="报表切换">
          {reportTabs.map((tab) => (
            <button
              key={tab.key}
              aria-current={tab.key === activeReport ? 'page' : undefined}
              className={tab.key === activeReport ? 'finance-tab active' : 'finance-tab'}
              type="button"
              onClick={() => setActiveReport(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeReport === 'receipt-usage' ? (
          <Table<ReceiptUsageDetailRow>
            columns={[
              { title: '水单号', dataIndex: 'receipt_no' },
              { title: '收款日期', dataIndex: 'received_at' },
              { title: '付款方', dataIndex: 'payer_name' },
              { title: '分摊类型', dataIndex: 'allocation_type' },
              { title: '合同号', dataIndex: 'contract_no', render: nullableText },
              { title: '发票号', dataIndex: 'invoice_no', render: nullableText },
              {
                title: '分摊金额',
                dataIndex: 'amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '下钻',
                render: (_, record) => (
                  <Button
                    size="small"
                    onClick={() => void openFinanceReportDrilldown(activeReport, record.receipt_no)}
                  >
                    来源
                  </Button>
                ),
              },
            ]}
            dataSource={receiptUsageReport?.rows ?? []}
            loading={loadingReport}
            pagination={false}
            rowKey={(record) =>
              `${record.receipt_no}-${record.invoice_no ?? record.contract_no ?? ''}-${record.allocated_at}`
            }
            size="small"
          />
        ) : null}

        {activeReport === 'bank-receipt-summary' ? (
          <Table<BankReceiptCurrencySummary>
            columns={[
              { title: '币种', dataIndex: 'currency' },
              { title: '水单数', dataIndex: 'receipt_count' },
              {
                title: '合计金额',
                dataIndex: 'total_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '已分摊',
                dataIndex: 'allocated_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '未分摊',
                dataIndex: 'unallocated_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
            ]}
            dataSource={bankReceiptSummaryReport?.currency_summaries ?? []}
            loading={loadingReport}
            pagination={false}
            rowKey="currency"
            size="small"
          />
        ) : null}

        {activeReport === 'goods-payment' ? (
          <Table<GoodsPaymentQueryRow>
            columns={[
              { title: '付款单号', dataIndex: 'request_no' },
              { title: '日期', dataIndex: 'request_date' },
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
              {
                title: '未付',
                dataIndex: 'outstanding_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              { title: '状态', dataIndex: 'status' },
              {
                title: '下钻',
                render: (_, record) => (
                  <Button
                    size="small"
                    onClick={() => void openFinanceReportDrilldown(activeReport, record.request_no)}
                  >
                    来源
                  </Button>
                ),
              },
            ]}
            dataSource={goodsPaymentReport?.rows ?? []}
            loading={loadingReport}
            pagination={false}
            rowKey="request_no"
            size="small"
          />
        ) : null}

        {activeReport === 'fee-payment' ? (
          <Table<FeePaymentQueryRow>
            columns={[
              { title: '付费单号', dataIndex: 'request_no' },
              { title: '日期', dataIndex: 'request_date' },
              { title: '合作伙伴', dataIndex: 'partner_name' },
              { title: '费用类型', dataIndex: 'fee_type' },
              { title: '出运单', dataIndex: 'shipment_no', render: nullableText },
              {
                title: '申请金额',
                dataIndex: 'requested_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '未付',
                dataIndex: 'outstanding_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              { title: '状态', dataIndex: 'status' },
              {
                title: '下钻',
                render: (_, record) => (
                  <Button
                    size="small"
                    onClick={() => void openFinanceReportDrilldown(activeReport, record.request_no)}
                  >
                    来源
                  </Button>
                ),
              },
            ]}
            dataSource={feePaymentReport?.rows ?? []}
            loading={loadingReport}
            pagination={false}
            rowKey="request_no"
            size="small"
          />
        ) : null}

        {activeReport === 'customs-receipt-collection' ? (
          <Table<CustomsReceiptCollectionRow>
            columns={[
              { title: '核销单号', dataIndex: 'document_no' },
              { title: '领用日期', dataIndex: 'received_at' },
              { title: '业务员', dataIndex: 'owner_user_name', render: nullableText },
              { title: '出运单', dataIndex: 'shipment_no', render: nullableText },
              { title: '报关单号', dataIndex: 'customs_declaration_no', render: nullableText },
              { title: '提醒日期', dataIndex: 'reminder_date' },
              { title: '催收状态', dataIndex: 'reminder_status' },
              {
                title: '可退税额',
                dataIndex: 'refundable_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '下钻',
                render: (_, record) => (
                  <Button
                    size="small"
                    onClick={() =>
                      void openFinanceReportDrilldown(activeReport, record.document_no)
                    }
                  >
                    来源
                  </Button>
                ),
              },
            ]}
            dataSource={customsCollectionReport?.rows ?? []}
            loading={loadingReport}
            pagination={false}
            rowKey="document_no"
            size="small"
          />
        ) : null}

        {activeReport === 'tax-refund-statistics' ? (
          <Table<TaxRefundCurrencyTotal>
            columns={[
              { title: '币种', dataIndex: 'currency' },
              { title: '核销单数', dataIndex: 'document_count' },
              {
                title: '可退税额',
                dataIndex: 'refundable_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '已退税额',
                dataIndex: 'refunded_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '待退税额',
                dataIndex: 'outstanding_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
            ]}
            dataSource={taxRefundStatisticsReport?.currency_totals ?? []}
            loading={loadingReport}
            pagination={false}
            rowKey="currency"
            size="small"
          />
        ) : null}

        {reportDrilldown ? (
          <section className="finance-action-block" aria-label="报表下钻">
            <PanelTitle icon={<ChevronRight size={18} />} title="来源下钻" />
            <Descriptions column={1} size="small">
              <Descriptions.Item label="来源编号">{reportDrilldown.source_no}</Descriptions.Item>
              <Descriptions.Item label="来源类型">{reportDrilldown.source_type}</Descriptions.Item>
              <Descriptions.Item label="入口">
                {reportDrilldown.items.length > 0
                  ? reportDrilldown.items
                      .map((item) => `${item.label}: ${item.value ?? ''} ${item.target_path ?? ''}`)
                      .join('；')
                  : '未找到可下钻来源'}
              </Descriptions.Item>
            </Descriptions>
          </section>
        ) : null}
      </section>
    </section>
  )
}
