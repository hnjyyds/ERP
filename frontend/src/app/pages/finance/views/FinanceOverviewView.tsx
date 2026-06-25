import { Skeleton, Table } from 'antd'
import { CheckCircle2, LayoutDashboard, ShieldCheck, Wallet } from 'lucide-react'
import type {
  FinanceCurrencySummary,
  FinanceOverview,
  FinancePartnerTypeSummary,
  FinanceShipmentProfit,
  FinanceStatusAmount,
} from '../../../../api'
import { PanelTitle } from '../../../../shared/ui'
import { formatDate, formatFinanceAmount, formatPercent, partnerTypeLabel } from '../../appHelpers'
import {
  purchaseInvoiceNoticeStatusLabel,
  samplePaymentStatusLabel,
  shipmentStatusLabel,
} from '../financeHelpers'
import type { FinancePageContext } from '../financeHelpers'

export function FinanceOverviewView({ ctx }: { ctx: FinancePageContext }) {
  const { moduleHeader, summaryStrip, moduleAlerts, loading, overview, summary } = ctx
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
            <PanelTitle icon={<Wallet size={18} />} title="出运利润明细" />
          </div>
          <Table<FinanceShipmentProfit>
            columns={[
              { title: '出货单', dataIndex: 'code', render: (value: string) => <strong>{value}</strong> },
              { title: '客户', dataIndex: 'customer_name' },
              { title: '状态', dataIndex: 'approval_status', render: shipmentStatusLabel },
              { title: '出货日期', dataIndex: 'shipment_date', render: formatDate },
              { title: '计划出运', dataIndex: 'planned_ship_date', render: formatDate },
              {
                title: '应收',
                dataIndex: 'receivable_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '应付',
                dataIndex: 'payable_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '利润',
                dataIndex: 'profit_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              { title: '利润率', dataIndex: 'profit_rate', render: formatPercent },
            ]}
            dataSource={overview?.shipment_profit_items ?? []}
            loading={loading}
            pagination={false}
            rowKey="id"
            size="small"
          />
        </section>

        <section className="workspace-panel finance-side-panel">
          <PanelTitle icon={<LayoutDashboard size={18} />} title="分币种汇总" />
          <Table<FinanceCurrencySummary>
            columns={[
              { title: '币种', dataIndex: 'currency' },
              { title: '出货', dataIndex: 'shipment_count' },
              {
                title: '应收',
                dataIndex: 'receivable_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: '利润',
                dataIndex: 'profit_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              { title: '利润率', dataIndex: 'profit_rate', render: formatPercent },
            ]}
            dataSource={overview?.currency_summaries ?? []}
            pagination={false}
            rowKey="currency"
            size="small"
          />
        </section>

        <section className="workspace-panel finance-side-panel">
          <PanelTitle icon={<CheckCircle2 size={18} />} title="开票和付款状态" />
          <div className="finance-status-stack">
            <div>
              <strong>采购开票通知</strong>
              <Table<FinanceStatusAmount>
                columns={[
                  { title: '状态', dataIndex: 'status', render: purchaseInvoiceNoticeStatusLabel },
                  { title: '数量', dataIndex: 'count' },
                  {
                    title: '金额',
                    dataIndex: 'amount',
                    render: (value: string, record) => formatFinanceAmount(value, record.currency),
                  },
                ]}
                dataSource={overview?.invoice_notice_statuses ?? []}
                pagination={false}
                rowKey={(record) => `${record.status}-${record.currency}`}
                size="small"
              />
            </div>
            <div>
              <strong>样品费用付款</strong>
              <Table<FinanceStatusAmount>
                columns={[
                  { title: '状态', dataIndex: 'status', render: samplePaymentStatusLabel },
                  { title: '数量', dataIndex: 'count' },
                  {
                    title: '金额',
                    dataIndex: 'amount',
                    render: (value: string, record) => formatFinanceAmount(value, record.currency),
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
          <PanelTitle icon={<ShieldCheck size={18} />} title="合作伙伴费用入口" />
          <dl className="finance-compact-list">
            <div>
              <dt>合作伙伴</dt>
              <dd>{summary?.partner_count ?? 0}</dd>
            </div>
            <div>
              <dt>启用伙伴</dt>
              <dd>{summary?.active_partner_count ?? 0}</dd>
            </div>
            <div>
              <dt>待收税票金额</dt>
              <dd>{formatFinanceAmount(summary?.invoice_notice_amount, '多币种')}</dd>
            </div>
          </dl>
          <Table<FinancePartnerTypeSummary>
            columns={[
              { title: '伙伴类型', dataIndex: 'partner_type', render: partnerTypeLabel },
              { title: '数量', dataIndex: 'count' },
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
