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
import { t, type TranslationKey } from '../../../appI18n'
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

  const reportTabs: { key: string; labelKey: TranslationKey }[] = [
    { key: 'receipt-usage', labelKey: 'finance.report.tab.receiptUsage' },
    { key: 'bank-receipt-summary', labelKey: 'finance.report.tab.bankReceiptSummary' },
    { key: 'goods-payment', labelKey: 'finance.report.tab.goodsPayment' },
    { key: 'fee-payment', labelKey: 'finance.report.tab.feePayment' },
    { key: 'customs-receipt-collection', labelKey: 'finance.report.tab.customsReceiptCollection' },
    { key: 'tax-refund-statistics', labelKey: 'finance.report.tab.taxRefundStatistics' },
  ]
  return (
    <section className="finance-page">
      {moduleHeader}
      {moduleAlerts}
      <section className="workspace-panel" aria-label={t('finance.report.pageAria')}>
        <div className="panel-heading toolbar-heading">
          <PanelTitle
            icon={<FileSpreadsheet size={18} />}
            title={t('finance.report.title')}
          />
          <form
            aria-label={t('finance.report.filter.formAria')}
            className="inline-filters single-line-filter-toolbar"
            onSubmit={(event) => {
              event.preventDefault()
              void loadFinanceReport(activeReport)
            }}
          >
            <label>
              {t('finance.report.filter.dateFrom')}
              <Input
                type="date"
                value={reportDateFrom}
                onChange={(event) => setReportDateFrom(event.target.value)}
              />
            </label>
            <label>
              {t('finance.report.filter.dateTo')}
              <Input
                type="date"
                value={reportDateTo}
                onChange={(event) => setReportDateTo(event.target.value)}
              />
            </label>
            <label>
              {t('finance.report.filter.currency')}
              <Input
                value={reportCurrency}
                placeholder={t('finance.report.filter.currencyPlaceholder')}
                onChange={(event) => setReportCurrency(event.target.value)}
              />
            </label>
            {activeReport === 'receipt-usage' ? (
              <label>
                {t('finance.report.filter.receiptNo')}
                <Input
                  value={reportReceiptNo}
                  onChange={(event) => setReportReceiptNo(event.target.value)}
                />
              </label>
            ) : null}
            {activeReport === 'bank-receipt-summary' ? (
              <label>
                {t('finance.report.filter.receiptType')}
                <FormSelect
                  value={reportReceiptType}
                  onChange={(event) => setReportReceiptType(event.target.value)}
                >
                  <option value="">{t('finance.report.filter.all')}</option>
                  <option value="advance">{t('finance.report.filter.receiptTypeAdvance')}</option>
                  <option value="normal">{t('finance.report.filter.receiptTypeNormal')}</option>
                  <option value="tax_refund">{t('finance.report.filter.receiptTypeTaxRefund')}</option>
                </FormSelect>
              </label>
            ) : null}
            {activeReport === 'goods-payment' ? (
              <label>
                {t('finance.report.filter.supplier')}
                <Input
                  value={reportSupplierName}
                  onChange={(event) => setReportSupplierName(event.target.value)}
                />
              </label>
            ) : null}
            {activeReport === 'fee-payment' ? (
              <>
                <label>
                  {t('finance.report.filter.partner')}
                  <Input
                    value={reportPartnerName}
                    onChange={(event) => setReportPartnerName(event.target.value)}
                  />
                </label>
                <label>
                  {t('finance.report.filter.feeType')}
                  <Input
                    value={reportFeeType}
                    onChange={(event) => setReportFeeType(event.target.value)}
                  />
                </label>
                <label>
                  {t('finance.report.filter.salesperson')}
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
                  {t('finance.report.filter.salesperson')}
                  <Input
                    value={reportOwnerUserId}
                    onChange={(event) => setReportOwnerUserId(event.target.value)}
                  />
                </label>
                <label>
                  {t('finance.report.filter.reminderStatus')}
                  <FormSelect
                    value={reportReminderStatus}
                    onChange={(event) => setReportReminderStatus(event.target.value)}
                  >
                    <option value="">{t('finance.report.filter.all')}</option>
                    <option value="pending">{t('finance.report.filter.reminderPending')}</option>
                    <option value="done">
                      {t('finance.tax.verificationReminder.status.done')}
                    </option>
                    <option value="overdue">
                      {t('finance.tax.verificationReminder.status.overdue')}
                    </option>
                  </FormSelect>
                </label>
                <label>
                  {t('finance.report.filter.includeRegistered')}
                  <input
                    aria-label={t('finance.report.filter.includeRegistered')}
                    checked={reportIncludeRegistered}
                    type="checkbox"
                    onChange={(event) => setReportIncludeRegistered(event.target.checked)}
                  />
                </label>
              </>
            ) : null}
            {['goods-payment', 'fee-payment', 'tax-refund-statistics'].includes(activeReport) ? (
              <label>
                {t('finance.field.status')}
                <Input
                  value={reportStatus}
                  onChange={(event) => setReportStatus(event.target.value)}
                />
              </label>
            ) : null}
            <Button htmlType="submit" icon={<Search size={16} />} loading={loadingReport}>
              {t('finance.report.action.search')}
            </Button>
            <Button
              htmlType="button"
              icon={<FileSpreadsheet size={16} />}
              loading={exportingReport}
              onClick={() => void exportFinanceReport(activeReport)}
            >
              {t('finance.report.action.exportCsv')}
            </Button>
          </form>
        </div>

        <nav className="finance-tab-rail" aria-label={t('finance.report.tab.aria')}>
          {reportTabs.map((tab) => (
            <button
              key={tab.key}
              aria-current={tab.key === activeReport ? 'page' : undefined}
              className={tab.key === activeReport ? 'finance-tab active' : 'finance-tab'}
              type="button"
              onClick={() => setActiveReport(tab.key)}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </nav>

        {activeReport === 'receipt-usage' ? (
          <Table<ReceiptUsageDetailRow>
            columns={[
              { title: t('finance.report.table.receiptNo'), dataIndex: 'receipt_no' },
              { title: t('finance.report.table.receivedAt'), dataIndex: 'received_at' },
              { title: t('finance.report.table.payerName'), dataIndex: 'payer_name' },
              { title: t('finance.report.table.allocationType'), dataIndex: 'allocation_type' },
              {
                title: t('finance.report.table.contractNo'),
                dataIndex: 'contract_no',
                render: nullableText,
              },
              {
                title: t('finance.report.table.invoiceNo'),
                dataIndex: 'invoice_no',
                render: nullableText,
              },
              {
                title: t('finance.report.table.allocatedAmount'),
                dataIndex: 'amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: t('finance.report.table.drilldown'),
                render: (_, record) => (
                  <Button
                    size="small"
                    onClick={() => void openFinanceReportDrilldown(activeReport, record.receipt_no)}
                  >
                    {t('finance.report.action.source')}
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
              { title: t('finance.field.currency'), dataIndex: 'currency' },
              { title: t('finance.report.table.receiptCount'), dataIndex: 'receipt_count' },
              {
                title: t('finance.report.table.totalAmount'),
                dataIndex: 'total_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: t('finance.report.table.allocated'),
                dataIndex: 'allocated_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: t('finance.report.table.unallocated'),
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
              { title: t('finance.report.table.paymentRequestNo'), dataIndex: 'request_no' },
              { title: t('finance.report.table.date'), dataIndex: 'request_date' },
              { title: t('finance.report.table.supplier'), dataIndex: 'supplier_name' },
              { title: t('finance.report.table.invoiceNo'), dataIndex: 'supplier_invoice_no' },
              {
                title: t('finance.report.table.requestedAmount'),
                dataIndex: 'requested_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: t('finance.report.table.paid'),
                dataIndex: 'paid_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: t('finance.report.table.unpaid'),
                dataIndex: 'outstanding_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              { title: t('finance.field.status'), dataIndex: 'status' },
              {
                title: t('finance.report.table.drilldown'),
                render: (_, record) => (
                  <Button
                    size="small"
                    onClick={() => void openFinanceReportDrilldown(activeReport, record.request_no)}
                  >
                    {t('finance.report.action.source')}
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
              { title: t('finance.report.table.feeRequestNo'), dataIndex: 'request_no' },
              { title: t('finance.report.table.date'), dataIndex: 'request_date' },
              { title: t('finance.report.table.partner'), dataIndex: 'partner_name' },
              { title: t('finance.report.table.feeType'), dataIndex: 'fee_type' },
              {
                title: t('finance.report.table.shipmentNo'),
                dataIndex: 'shipment_no',
                render: nullableText,
              },
              {
                title: t('finance.report.table.requestedAmount'),
                dataIndex: 'requested_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: t('finance.report.table.unpaid'),
                dataIndex: 'outstanding_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              { title: t('finance.field.status'), dataIndex: 'status' },
              {
                title: t('finance.report.table.drilldown'),
                render: (_, record) => (
                  <Button
                    size="small"
                    onClick={() => void openFinanceReportDrilldown(activeReport, record.request_no)}
                  >
                    {t('finance.report.action.source')}
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
              { title: t('finance.report.table.documentNo'), dataIndex: 'document_no' },
              { title: t('finance.report.table.issuedAt'), dataIndex: 'received_at' },
              {
                title: t('finance.report.table.salesperson'),
                dataIndex: 'owner_user_name',
                render: nullableText,
              },
              {
                title: t('finance.report.table.shipmentNo'),
                dataIndex: 'shipment_no',
                render: nullableText,
              },
              {
                title: t('finance.report.table.customsDeclarationNo'),
                dataIndex: 'customs_declaration_no',
                render: nullableText,
              },
              { title: t('finance.report.table.reminderDate'), dataIndex: 'reminder_date' },
              { title: t('finance.report.table.reminderStatus'), dataIndex: 'reminder_status' },
              {
                title: t('finance.report.table.refundableAmount'),
                dataIndex: 'refundable_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: t('finance.report.table.drilldown'),
                render: (_, record) => (
                  <Button
                    size="small"
                    onClick={() =>
                      void openFinanceReportDrilldown(activeReport, record.document_no)
                    }
                  >
                    {t('finance.report.action.source')}
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
              { title: t('finance.field.currency'), dataIndex: 'currency' },
              { title: t('finance.report.table.documentCount'), dataIndex: 'document_count' },
              {
                title: t('finance.report.table.refundableAmount'),
                dataIndex: 'refundable_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: t('finance.report.table.refundedAmount'),
                dataIndex: 'refunded_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: t('finance.report.table.pendingRefundAmount'),
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
          <section className="finance-action-block" aria-label={t('finance.report.drilldown.aria')}>
            <PanelTitle
              icon={<ChevronRight size={18} />}
              title={t('finance.report.drilldown.title')}
            />
            <Descriptions column={1} size="small">
              <Descriptions.Item label={t('finance.report.drilldown.sourceNo')}>
                {reportDrilldown.source_no}
              </Descriptions.Item>
              <Descriptions.Item label={t('finance.report.drilldown.sourceType')}>
                {reportDrilldown.source_type}
              </Descriptions.Item>
              <Descriptions.Item label={t('finance.report.drilldown.entry')}>
                {reportDrilldown.items.length > 0
                  ? reportDrilldown.items
                      .map((item) => `${item.label}: ${item.value ?? ''} ${item.target_path ?? ''}`)
                      .join('; ')
                  : t('finance.report.empty.drilldownSource')}
              </Descriptions.Item>
            </Descriptions>
          </section>
        ) : null}
      </section>
    </section>
  )
}
