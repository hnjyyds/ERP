import { Skeleton, Table } from 'antd'
import { LayoutDashboard, CheckCircle2, ShieldCheck, Wallet } from 'lucide-react'
import {
  FinanceCurrencySummary,
  FinancePartnerTypeSummary,
  FinanceShipmentProfit,
  FinanceStatusAmount,
} from '@/api'
import { PanelTitle } from '@/shared/ui'
import { t } from '@/app/appI18n'
import { formatDate, formatFinanceAmount, formatPercent, partnerTypeLabel } from '@/app/pages/appHelpers'
import {
  shipmentStatusLabel,
  purchaseInvoiceNoticeStatusLabel,
  samplePaymentStatusLabel,
} from '@/app/pages/finance/financeHelpers'
import type { FinanceOverviewModel } from '@/app/pages/finance/hooks/useFinanceOverviewModule'
import type { FinanceViewShell } from '@/app/pages/finance/financePageTypes'

type Props = {
  model: FinanceOverviewModel
  shell: FinanceViewShell
}

export function FinanceOverviewView({ model, shell }: Props) {
  const { overview, summary } = model
  const { moduleAlerts, moduleHeader, summaryStrip, loading } = shell

  return (
    <section className="finance-page">
      {moduleHeader}
      {summaryStrip}
      {moduleAlerts}
      {loading && !overview ? (
        <section className="workspace-panel">
          <Skeleton active paragraph={{ rows: 8 }} />
        </section>
      ) : (
        <section className="finance-grid">
          <section className="workspace-panel finance-profit-panel">
            <div className="panel-heading toolbar-heading">
              <PanelTitle
                icon={<Wallet size={18} />}
                title={t('finance.overview.panel.shipmentProfit')}
              />
            </div>
            <Table<FinanceShipmentProfit>
              columns={[
                {
                  title: t('finance.overview.table.code'),
                  dataIndex: 'code',
                  render: (value: string) => <strong>{value}</strong>,
                },
                { title: t('finance.overview.table.customer'), dataIndex: 'customer_name' },
                {
                  title: t('finance.field.status'),
                  dataIndex: 'approval_status',
                  render: shipmentStatusLabel,
                },
                {
                  title: t('finance.overview.table.shipmentDate'),
                  dataIndex: 'shipment_date',
                  render: formatDate,
                },
                {
                  title: t('finance.overview.table.plannedShipDate'),
                  dataIndex: 'planned_ship_date',
                  render: formatDate,
                },
                {
                  title: t('finance.overview.table.receivable'),
                  dataIndex: 'receivable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.overview.table.payable'),
                  dataIndex: 'payable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.overview.table.profit'),
                  dataIndex: 'profit_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.overview.table.profitRate'),
                  dataIndex: 'profit_rate',
                  render: formatPercent,
                },
              ]}
              dataSource={overview?.shipment_profit_items ?? []}
              loading={loading}
              pagination={false}
              rowKey="id"
              size="small"
            />
          </section>

          <section className="workspace-panel finance-side-panel">
            <PanelTitle
              icon={<LayoutDashboard size={18} />}
              title={t('finance.overview.panel.currencySummary')}
            />
            <Table<FinanceCurrencySummary>
              columns={[
                { title: t('finance.field.currency'), dataIndex: 'currency' },
                { title: t('finance.overview.table.shipmentCount'), dataIndex: 'shipment_count' },
                {
                  title: t('finance.overview.table.receivable'),
                  dataIndex: 'receivable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.overview.table.profit'),
                  dataIndex: 'profit_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('finance.overview.table.profitRate'),
                  dataIndex: 'profit_rate',
                  render: formatPercent,
                },
              ]}
              dataSource={overview?.currency_summaries ?? []}
              pagination={false}
              rowKey="currency"
              size="small"
            />
          </section>

          <section className="workspace-panel finance-side-panel">
            <PanelTitle
              icon={<CheckCircle2 size={18} />}
              title={t('finance.overview.panel.invoicePaymentStatus')}
            />
            <div className="finance-status-stack">
              <div>
                <strong>{t('finance.overview.panel.purchaseInvoiceNotice')}</strong>
                <Table<FinanceStatusAmount>
                  columns={[
                    {
                      title: t('finance.field.status'),
                      dataIndex: 'status',
                      render: purchaseInvoiceNoticeStatusLabel,
                    },
                    { title: t('finance.overview.table.count'), dataIndex: 'count' },
                    {
                      title: t('finance.field.amount'),
                      dataIndex: 'amount',
                      render: (value: string, record) =>
                        formatFinanceAmount(value, record.currency),
                    },
                  ]}
                  dataSource={overview?.invoice_notice_statuses ?? []}
                  pagination={false}
                  rowKey={(record) => `${record.status}-${record.currency}`}
                  size="small"
                />
              </div>
              <div>
                <strong>{t('finance.overview.panel.sampleFeePayment')}</strong>
                <Table<FinanceStatusAmount>
                  columns={[
                    {
                      title: t('finance.field.status'),
                      dataIndex: 'status',
                      render: samplePaymentStatusLabel,
                    },
                    { title: t('finance.overview.table.count'), dataIndex: 'count' },
                    {
                      title: t('finance.field.amount'),
                      dataIndex: 'amount',
                      render: (value: string, record) =>
                        formatFinanceAmount(value, record.currency),
                    },
                  ]}
                  dataSource={overview?.sample_fee_statuses ?? []}
                  pagination={false}
                  rowKey={(record) => `${record.status}-${record.currency}`}
                  size="small"
                />
              </div>
            </div>
          </section>

          <section className="workspace-panel finance-side-panel">
            <PanelTitle
              icon={<ShieldCheck size={18} />}
              title={t('finance.overview.panel.partnerFeeEntry')}
            />
            <dl className="finance-compact-list">
              <div>
                <dt>{t('finance.overview.summary.partnerCount')}</dt>
                <dd>{summary?.partner_count ?? 0}</dd>
              </div>
              <div>
                <dt>{t('finance.overview.summary.activePartner')}</dt>
                <dd>{summary?.active_partner_count ?? 0}</dd>
              </div>
              <div>
                <dt>{t('finance.overview.summary.pendingInvoiceAmount')}</dt>
                {/* 多币种：formatFinanceAmount 对空币种不显示前缀 */}
                <dd>{formatFinanceAmount(summary?.invoice_notice_amount, '')}</dd>
              </div>
            </dl>
            <Table<FinancePartnerTypeSummary>
              columns={[
                {
                  title: t('finance.overview.table.partnerType'),
                  dataIndex: 'partner_type',
                  render: partnerTypeLabel,
                },
                { title: t('finance.overview.table.count'), dataIndex: 'count' },
              ]}
              dataSource={overview?.partner_type_summaries ?? []}
              pagination={false}
              rowKey="partner_type"
              size="small"
            />
          </section>
        </section>
      )}
    </section>
  )
}
