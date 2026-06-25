import { reportingDocumentTypeOptions, reportingStatusOptions, exportContractStatusOptions } from '../../../shared/formOptions'
import { Alert, Button, Descriptions, Input, Modal, Select, Skeleton, Table, Tag } from 'antd'
import { BarChart3, LayoutDashboard, Search, ShieldCheck , CheckCircle2} from 'lucide-react'
import { useEffect, useMemo, useState , ReactNode} from 'react'
import { getFinanceOverview, listReportingStatistics, drilldownFinanceReport, explainFinanceReport, type FinanceOverview, type ReportingStatistics, type FinanceShipmentProfit, type FinanceCurrencySummary, type FinancePartnerTypeSummary, type FinanceStatusAmount, type ReportDocumentStatistic, type StatusAmountStatistic, type SalesMonthlyShipmentStatistic, type CustomerShipmentStatistic, type MenuItem, type FinanceReportDrilldown, type FinanceReportExplanation , ApprovalDocument, ApprovalQuery, ApprovalTypeSummary, ShipmentStatisticItem, listApprovalDocuments} from '../../../api'
import { reportingPath, type FinanceModule } from '../../routes'
import { Metric, PanelTitle , FormSelect} from '../../../shared/ui'
import { showError } from '../../../shared/errors'
import { t } from '../../App'
import { formatDate, formatFinanceAmount, formatMoney, formatPercent, nullableText, pageTitle, statusTag, severityTag, partnerTypeLabel, OperationFlowRail, type ModuleNavigationProps } from '../appHelpers'

type FollowupTemplateFormState = {
  name: string
  enabled: boolean
  is_default: boolean
  contract_days: string
  contract_remind: string
  confirm_days: string
  confirm_remind: string
  bulk_days: string
  bulk_remind: string
  qc_days: string
  qc_remind: string
  inbound_days: string
  inbound_remind: string
  outbound_days: string
  outbound_remind: string
}


function approvalDocumentTypeLabel(value: string): string {
  return reportingDocumentTypeOptions.find((item) => item.value === value)?.label ?? value
}

function approvalDocumentTypeTag(value: string): ReactNode {
  const color = value === 'export_contract' ? 'processing' : 'purple'
  return <Tag color={color}>{approvalDocumentTypeLabel(value)}</Tag>
}

function approvalStatusTag(value: string): ReactNode {
  const color = value === 'approved' ? 'success' : value === 'submitted' ? 'warning' : 'default'
  const label = reportingStatusOptions.find((item) => item.value === value)?.label ?? value
  return <Tag color={color}>{label}</Tag>
}

function sourcePathTag(value: string): ReactNode {
  return <Tag color="default">{value}</Tag>
}


export function FollowupTemplateNodeFields({
  daysKey,
  label,
  remindKey,
  remindLabel,
  setTemplateForm,
  templateForm,
}: {
  daysKey: keyof FollowupTemplateFormState
  label: string
  remindKey: keyof FollowupTemplateFormState
  remindLabel: string
  setTemplateForm: (form: FollowupTemplateFormState) => void
  templateForm: FollowupTemplateFormState
}) {
  return (
    <div className="form-pair two">
      <label htmlFor={`followup-${String(daysKey).replace('_', '-')}`}>
        {label}
        <Input
          id={`followup-${String(daysKey).replace('_', '-')}`}
          min="0"
          type="number"
          value={String(templateForm[daysKey])}
          onChange={(event) => setTemplateForm({ ...templateForm, [daysKey]: event.target.value })}
        />
      </label>
      <label htmlFor={`followup-${String(remindKey).replace('_', '-')}`}>
        {remindLabel}
        <Input
          id={`followup-${String(remindKey).replace('_', '-')}`}
          min="0"
          type="number"
          value={String(templateForm[remindKey])}
          onChange={(event) => setTemplateForm({ ...templateForm, [remindKey]: event.target.value })}
        />
      </label>
    </div>
  )
}

export function ModulePage({ menu }: { menu: MenuItem | null }) {
  return (
    <section className="workspace-panel module-panel">
      <PanelTitle icon={<LayoutDashboard size={18} />} title={menu?.label ?? '业务模块'} />
      <div className="module-state">
        <strong>{menu?.label ?? '业务模块'}</strong>
        <span>React 工作台入口已就绪</span>
      </div>
    </section>
  )
}

export function AccessDeniedPage() {
  return (
    <section className="module-panel access-denied-panel" role="alert">
      <ShieldCheck size={30} strokeWidth={1.8} />
      <strong>{t('access.deniedTitle')}</strong>
      <span>{t('access.deniedDescription')}</span>
    </section>
  )
}

export function ReportingPage({ onNavigate }: ModuleNavigationProps) {
  const [approvals, setApprovals] = useState<ApprovalQuery | null>(null)
  const [statistics, setStatistics] = useState<ReportingStatistics | null>(null)
  const [documentTypeFilter, setDocumentTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('submitted')
  const [applicantUserFilter, setApplicantUserFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [statisticsDateFromFilter, setStatisticsDateFromFilter] = useState('')
  const [statisticsDateToFilter, setStatisticsDateToFilter] = useState('')
  const [statisticsStatusFilter, setStatisticsStatusFilter] = useState('')
  const [statisticsCustomerFilter, setStatisticsCustomerFilter] = useState('')
  const [statisticsSupplierFilter, setStatisticsSupplierFilter] = useState('')
  const [statisticsSalesFilter, setStatisticsSalesFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStatistics, setLoadingStatistics] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void loadApprovals()
    void loadStatistics()
  }, [])

  async function loadApprovals() {
    setLoading(true)
    setError('')
    try {
      const result = await listApprovalDocuments({
        document_type: documentTypeFilter || undefined,
        status: statusFilter || undefined,
        applicant_user_id: applicantUserFilter.trim() || undefined,
        date_from: dateFromFilter || undefined,
        date_to: dateToFilter || undefined,
      })
      setApprovals(result)
    } catch (caught) {
      showError(caught, '经理查询加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadStatistics() {
    setLoadingStatistics(true)
    setError('')
    try {
      const result = await listReportingStatistics({
        date_from: statisticsDateFromFilter || undefined,
        date_to: statisticsDateToFilter || undefined,
        approval_status: statisticsStatusFilter || undefined,
        customer_id: statisticsCustomerFilter.trim() || undefined,
        supplier_id: statisticsSupplierFilter.trim() || undefined,
        sales_user_id: statisticsSalesFilter.trim() || undefined,
      })
      setStatistics(result)
    } catch (caught) {
      showError(caught, '统计分析加载失败')
    } finally {
      setLoadingStatistics(false)
    }
  }

  function resetFilters() {
    setDocumentTypeFilter('')
    setStatusFilter('submitted')
    setApplicantUserFilter('')
    setDateFromFilter('')
    setDateToFilter('')
    void listApprovalDocuments({ status: 'submitted' })
      .then(setApprovals)
      .catch((caught: unknown) => {
        showError(caught, '经理查询加载失败')
      })
  }

  function resetStatisticsFilters() {
    setStatisticsDateFromFilter('')
    setStatisticsDateToFilter('')
    setStatisticsStatusFilter('')
    setStatisticsCustomerFilter('')
    setStatisticsSupplierFilter('')
    setStatisticsSalesFilter('')
    void listReportingStatistics()
      .then(setStatistics)
      .catch((caught: unknown) => {
        showError(caught, '统计分析加载失败')
      })
  }

  const items = approvals?.items ?? []
  const statisticsSummary = statistics?.summary

  return (
    <section className="reporting-page">
      <OperationFlowRail activeLabel="经理报表" activePath={reportingPath} kind="finance" onNavigate={onNavigate} />

      <div className="summary-strip" aria-label="经理查询概览">
        <Metric label="审批单据" value={approvals?.total ?? 0} />
        <Metric
          label="待审批"
          value={approvals?.pending_count ?? 0}
          intent={(approvals?.pending_count ?? 0) > 0 ? 'warning' : 'normal'}
        />
        <Metric label="已审批" value={approvals?.approved_count ?? 0} />
        <Metric label="单据类型" value={approvals?.type_summaries.length ?? 0} />
      </div>

      {error ? <Alert className="workspace-alert" title={error} type="error" showIcon /> : null}

      <section className="reporting-grid">
        <section className="workspace-panel reporting-approval-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<BarChart3 size={18} />} title="审批单据查询" />
          </div>
          <form
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadApprovals()
            }}
          >
            <label>
              单据类型
              <FormSelect
                value={documentTypeFilter}
                onChange={(event) => setDocumentTypeFilter(event.target.value)}
              >
                <option value="">全部类型</option>
                {reportingDocumentTypeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              审批状态
              <FormSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">全部状态</option>
                {reportingStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              申请人标识
              <Input
                value={applicantUserFilter}
                placeholder="u-001"
                onChange={(event) => setApplicantUserFilter(event.target.value)}
              />
            </label>
            <label>
              开始日期
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(event) => setDateFromFilter(event.target.value)}
              />
            </label>
            <label>
              结束日期
              <Input
                type="date"
                value={dateToFilter}
                onChange={(event) => setDateToFilter(event.target.value)}
              />
            </label>
            <Button htmlType="submit" icon={<Search size={16} />} loading={loading}>
              查询
            </Button>
            <Button type="default" onClick={resetFilters}>
              重置
            </Button>
          </form>

          <Table<ApprovalDocument>
            columns={[
              {
                title: '单据编号',
                dataIndex: 'document_no',
                render: (value: string) => <strong>{value}</strong>,
              },
              { title: '类型', dataIndex: 'document_type', render: approvalDocumentTypeTag },
              { title: '状态', dataIndex: 'status', render: approvalStatusTag },
              { title: '客户/供应商', dataIndex: 'counterparty_name' },
              { title: '申请人', dataIndex: 'applicant_user_name', render: nullableText },
              { title: '业务日期', dataIndex: 'business_date', render: formatDate },
              { title: '提交日期', dataIndex: 'submitted_at', render: formatDate },
              { title: '审批日期', dataIndex: 'approved_at', render: formatDate },
              {
                title: '金额',
                dataIndex: 'amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
            ]}
            dataSource={items}
            loading={loading}
            pagination={false}
            rowKey={(record) => `${record.document_type}-${record.document_id}`}
            size="small"
          />
        </section>

        <section className="workspace-panel reporting-type-summary-panel">
          <PanelTitle icon={<CheckCircle2 size={18} />} title="类型汇总" />
          <Table<ApprovalTypeSummary>
            columns={[
              { title: '单据类型', dataIndex: 'document_type', render: approvalDocumentTypeTag },
              { title: '待审批', dataIndex: 'pending_count' },
              { title: '已审批', dataIndex: 'approved_count' },
              { title: '合计', dataIndex: 'total_count' },
            ]}
            dataSource={approvals?.type_summaries ?? []}
            loading={loading}
            pagination={false}
            rowKey="document_type"
            size="small"
          />
        </section>
      </section>

      <section className="reporting-statistics-grid" aria-label="统计分析报表">
        <section className="workspace-panel reporting-statistics-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<BarChart3 size={18} />} title="统计分析报表" />
          </div>
          <form
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadStatistics()
            }}
          >
            <label>
              统计开始
              <Input
                type="date"
                value={statisticsDateFromFilter}
                onChange={(event) => setStatisticsDateFromFilter(event.target.value)}
              />
            </label>
            <label>
              统计结束
              <Input
                type="date"
                value={statisticsDateToFilter}
                onChange={(event) => setStatisticsDateToFilter(event.target.value)}
              />
            </label>
            <label>
              统计状态
              <FormSelect
                value={statisticsStatusFilter}
                onChange={(event) => setStatisticsStatusFilter(event.target.value)}
              >
                <option value="">全部状态</option>
                {exportContractStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              客户标识
              <Input
                value={statisticsCustomerFilter}
                placeholder="customer-id"
                onChange={(event) => setStatisticsCustomerFilter(event.target.value)}
              />
            </label>
            <label>
              供应商标识
              <Input
                value={statisticsSupplierFilter}
                placeholder="supplier-id"
                onChange={(event) => setStatisticsSupplierFilter(event.target.value)}
              />
            </label>
            <label>
              业务员标识
              <Input
                value={statisticsSalesFilter}
                placeholder="u-001"
                onChange={(event) => setStatisticsSalesFilter(event.target.value)}
              />
            </label>
            <Button htmlType="submit" icon={<Search size={16} />} loading={loadingStatistics}>
              查询统计
            </Button>
            <Button type="default" onClick={resetStatisticsFilters}>
              重置统计
            </Button>
          </form>

          <div className="summary-strip reporting-stat-strip">
            <Metric
              label="出口合同"
              value={formatFinanceAmount(
                statisticsSummary?.export_contract_amount,
                statisticsSummary?.currency_label,
              )}
            />
            <Metric
              label="采购合同"
              value={formatFinanceAmount(
                statisticsSummary?.purchase_contract_amount,
                statisticsSummary?.currency_label,
              )}
            />
            <Metric
              label="出货应收"
              value={formatFinanceAmount(
                statisticsSummary?.shipment_receivable_amount,
                statisticsSummary?.currency_label,
              )}
            />
            <Metric
              label="出货利润"
              value={formatFinanceAmount(
                statisticsSummary?.shipment_profit_amount,
                statisticsSummary?.currency_label,
              )}
            />
          </div>

          <Table<CustomerShipmentStatistic>
            columns={[
              { title: '客户', dataIndex: 'customer_name' },
              { title: '出货单', dataIndex: 'shipment_count' },
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
              { title: '下钻', dataIndex: 'source_path', render: sourcePathTag },
            ]}
            dataSource={statistics?.customer_shipments ?? []}
            loading={loadingStatistics}
            pagination={false}
            rowKey={(record) => `${record.customer_id ?? record.customer_name}-${record.currency}`}
            size="small"
          />
        </section>

        <section className="workspace-panel reporting-stat-side-panel">
          <PanelTitle icon={<CheckCircle2 size={18} />} title="业务员月度出货" />
          <Table<SalesMonthlyShipmentStatistic>
            columns={[
              { title: '月份', dataIndex: 'period' },
              { title: '业务员', dataIndex: 'sales_user_name', render: nullableText },
              { title: '出货单', dataIndex: 'shipment_count' },
              {
                title: '出货额',
                dataIndex: 'shipped_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
            ]}
            dataSource={statistics?.sales_monthly_shipments ?? []}
            loading={loadingStatistics}
            pagination={false}
            rowKey={(record) => `${record.period}-${record.sales_user_id ?? '-'}-${record.currency}`}
            size="small"
          />
        </section>

        <section className="workspace-panel reporting-stat-side-panel">
          <PanelTitle icon={<ShieldCheck size={18} />} title="合同状态金额" />
          <div className="reporting-status-stack">
            <div>
              <strong>出口合同</strong>
              <Table<StatusAmountStatistic>
                columns={[
                  { title: '状态', dataIndex: 'status', render: approvalStatusTag },
                  { title: '数量', dataIndex: 'count' },
                  {
                    title: '金额',
                    dataIndex: 'amount',
                    render: (value: string, record) => formatFinanceAmount(value, record.currency),
                  },
                ]}
                dataSource={statistics?.export_contract_statuses ?? []}
                loading={loadingStatistics}
                pagination={false}
                rowKey={(record) => `export-${record.status}-${record.currency}`}
                size="small"
              />
            </div>
            <div>
              <strong>采购合同</strong>
              <Table<StatusAmountStatistic>
                columns={[
                  { title: '状态', dataIndex: 'status', render: approvalStatusTag },
                  { title: '数量', dataIndex: 'count' },
                  {
                    title: '金额',
                    dataIndex: 'amount',
                    render: (value: string, record) => formatFinanceAmount(value, record.currency),
                  },
                ]}
                dataSource={statistics?.purchase_contract_statuses ?? []}
                loading={loadingStatistics}
                pagination={false}
                rowKey={(record) => `purchase-${record.status}-${record.currency}`}
                size="small"
              />
            </div>
          </div>
        </section>

        <section className="workspace-panel reporting-drilldown-panel">
          <PanelTitle icon={<Search size={18} />} title="原始单据追溯" />
          <div className="reporting-drilldown-stack">
            <Table<ShipmentStatisticItem>
              columns={[
                { title: '出货单', dataIndex: 'shipment_no', render: (value: string) => <strong>{value}</strong> },
                { title: '客户', dataIndex: 'customer_name' },
                { title: '状态', dataIndex: 'status', render: approvalStatusTag },
                { title: '出货日', dataIndex: 'shipment_date', render: formatDate },
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
                { title: '下钻', dataIndex: 'source_path', render: sourcePathTag },
              ]}
              dataSource={statistics?.shipment_items ?? []}
              loading={loadingStatistics}
              pagination={false}
              rowKey="shipment_id"
              size="small"
            />
            <Table<ReportDocumentStatistic>
              columns={[
                { title: '出口合同', dataIndex: 'document_no', render: (value: string) => <strong>{value}</strong> },
                { title: '客户', dataIndex: 'party_name' },
                { title: '业务员', dataIndex: 'business_user_name', render: nullableText },
                { title: '状态', dataIndex: 'status', render: approvalStatusTag },
                {
                  title: '金额',
                  dataIndex: 'amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                { title: '下钻', dataIndex: 'source_path', render: sourcePathTag },
              ]}
              dataSource={statistics?.export_contract_items ?? []}
              loading={loadingStatistics}
              pagination={false}
              rowKey="document_id"
              size="small"
            />
          </div>
        </section>
      </section>
    </section>
  )
}

