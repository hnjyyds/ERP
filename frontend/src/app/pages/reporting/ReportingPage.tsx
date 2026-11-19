import {
  type ApprovalDocument,
  type ApprovalQuery,
  type ApprovalTypeSummary,
  type CustomerShipmentStatistic,
  type MenuItem,
  type ReportDocumentStatistic,
  type ReportingStatistics,
  type SalesMonthlyShipmentStatistic,
  type ShipmentStatisticItem,
  type StatusAmountStatistic,
  listApprovalDocuments,
  listReportingStatistics,
} from '@/api'
import { showError } from '@/shared/errors'
import { t, type TranslationKey } from '@/app/appI18n'
import {
  exportContractStatusOptions,
  reportingDocumentTypeOptions,
  reportingStatusOptions,
} from '@/shared/formOptions'
import { FormSelect, Metric, PanelTitle } from '@/shared/ui'
import { ListEmptyState } from '@/shared/ui/ListEmptyState'
import { Button, Input, Table, Tag } from 'antd'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  LayoutDashboard,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { exportContractPath, moduleDetailPath, purchaseContractPath } from '@/app/routes'
import {
  formatDate,
  formatFinanceAmount,
  nullableText,
  type ModuleNavigationProps,
} from '@/app/pages/appHelpers'

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
  const option = reportingDocumentTypeOptions.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function approvalDocumentTypeTag(value: string): ReactNode {
  const color = value === 'export_contract' ? 'processing' : 'purple'
  return <Tag color={color}>{approvalDocumentTypeLabel(value)}</Tag>
}

const REPORTING_STATUS_LABEL_KEYS: Record<string, TranslationKey> = {
  draft: 'finance.report.status.draft',
  submitted: 'finance.report.status.submitted',
  approved: 'finance.report.status.approved',
  rejected: 'finance.report.status.rejected',
  cancelled: 'finance.report.status.cancelled',
}

function reportingStatusLabel(value: string): string {
  const labelKey = REPORTING_STATUS_LABEL_KEYS[value]
  return labelKey ? t(labelKey) : value
}

function reportingStatusColor(value: string): string {
  if (value === 'approved') return 'success'
  if (value === 'submitted') return 'warning'
  if (value === 'rejected') return 'error'
  return 'default'
}

function approvalStatusTag(value: string): ReactNode {
  return <Tag color={reportingStatusColor(value)}>{reportingStatusLabel(value)}</Tag>
}

const SOURCE_PATH_LABEL_KEYS: Array<[string, TranslationKey]> = [
  ['/sales/contracts', 'reporting.statistics.drilldown.exportContract'],
  ['/purchase/contracts', 'reporting.statistics.drilldown.purchaseContract'],
  ['/sales/shipments', 'reporting.statistics.drilldown.shipment'],
]

function sourcePathLink(value: string, onNavigate: (path: string) => void): ReactNode {
  const matched = SOURCE_PATH_LABEL_KEYS.find(([prefix]) => value.startsWith(prefix))
  if (!matched) {
    return <span className="muted-text">{t('reporting.table.unsupported')}</span>
  }
  return (
    <Button type="link" size="small" onClick={() => onNavigate(value)}>
      {t(matched[1])}
    </Button>
  )
}

function approvalDocumentPath(document: ApprovalDocument): string | null {
  if (document.document_type === 'export_contract') {
    return moduleDetailPath(exportContractPath, document.document_id)
  }
  if (document.document_type === 'purchase_contract') {
    return moduleDetailPath(purchaseContractPath, document.document_id)
  }
  return null
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
          onChange={(event) =>
            setTemplateForm({ ...templateForm, [remindKey]: event.target.value })
          }
        />
      </label>
    </div>
  )
}

export function ModulePage({ menu }: { menu: MenuItem | null }) {
  return (
    <section className="workspace-panel module-panel">
      <PanelTitle
        icon={<LayoutDashboard size={18} />}
        title={menu?.label ?? t('page.businessModule')}
      />
      <div className="module-state">
        <strong>{menu?.label ?? t('page.businessModule')}</strong>
        <span>{t('reporting.module.ready')}</span>
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
  const [approvalsLoadError, setApprovalsLoadError] = useState(false)
  const [loadingStatistics, setLoadingStatistics] = useState(false)
  const [statisticsLoadError, setStatisticsLoadError] = useState(false)

  useEffect(() => {
    void loadApprovals()
    void loadStatistics()
  }, [])

  async function loadApprovals() {
    setLoading(true)
    setApprovalsLoadError(false)
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
      setApprovalsLoadError(true)
      showError(caught, t('reporting.message.approvalLoadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function loadStatistics() {
    setLoadingStatistics(true)
    setStatisticsLoadError(false)
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
      setStatisticsLoadError(true)
      showError(caught, t('reporting.message.statisticsLoadFailed'))
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
    setApprovalsLoadError(false)
    void listApprovalDocuments({ status: 'submitted' })
      .then(setApprovals)
      .catch((caught: unknown) => {
        setApprovalsLoadError(true)
        showError(caught, t('reporting.message.approvalLoadFailed'))
      })
  }

  function clearApprovalFilters() {
    setDocumentTypeFilter('')
    setStatusFilter('')
    setApplicantUserFilter('')
    setDateFromFilter('')
    setDateToFilter('')
    setApprovalsLoadError(false)
    void listApprovalDocuments({})
      .then(setApprovals)
      .catch((caught: unknown) => {
        setApprovalsLoadError(true)
        showError(caught, t('reporting.message.approvalLoadFailed'))
      })
  }

  function resetStatisticsFilters() {
    setStatisticsDateFromFilter('')
    setStatisticsDateToFilter('')
    setStatisticsStatusFilter('')
    setStatisticsCustomerFilter('')
    setStatisticsSupplierFilter('')
    setStatisticsSalesFilter('')
    setStatisticsLoadError(false)
    void listReportingStatistics()
      .then(setStatistics)
      .catch((caught: unknown) => {
        setStatisticsLoadError(true)
        showError(caught, t('reporting.message.statisticsLoadFailed'))
      })
  }

  const items = approvals?.items ?? []
  const statisticsSummary = statistics?.summary
  const approvalFiltered = Boolean(
    documentTypeFilter ||
      applicantUserFilter.trim() ||
      dateFromFilter ||
      dateToFilter ||
      statusFilter.trim() !== '',
  )
  const statisticsFiltered = Boolean(
    statisticsDateFromFilter ||
      statisticsDateToFilter ||
      statisticsStatusFilter ||
      statisticsCustomerFilter.trim() ||
      statisticsSupplierFilter.trim() ||
      statisticsSalesFilter.trim(),
  )

  return (
    <section className="reporting-page">
      <div className="summary-strip" aria-label={t('reporting.pageAria')}>
        <Metric label={t('reporting.metric.documents')} value={approvals?.total ?? 0} />
        <Metric
          label={t('reporting.metric.pending')}
          value={approvals?.pending_count ?? 0}
          intent={(approvals?.pending_count ?? 0) > 0 ? 'warning' : 'normal'}
        />
        <Metric label={t('reporting.metric.approved')} value={approvals?.approved_count ?? 0} />
        <Metric
          label={t('reporting.metric.documentTypes')}
          value={approvals?.type_summaries.length ?? 0}
        />
      </div>


      <section className="reporting-grid">
        <section className="workspace-panel reporting-approval-list-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle
              icon={<BarChart3 size={18} />}
              title={t('reporting.panel.approvalListTitle')}
            />
          </div>
          <form
            className="inline-filters single-line-filter-toolbar"
            onSubmit={(event) => {
              event.preventDefault()
              void loadApprovals()
            }}
          >
            <label>
              {t('reporting.field.documentType')}
              <FormSelect
                value={documentTypeFilter}
                onChange={(event) => setDocumentTypeFilter(event.target.value)}
              >
                <option value="">{t('reporting.filter.allTypes')}</option>
                {reportingDocumentTypeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              {t('reporting.field.approvalStatus')}
              <FormSelect
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">{t('reporting.filter.allStatuses')}</option>
                {reportingStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              {t('reporting.field.applicant')}
              <Input
                value={applicantUserFilter}
                placeholder={t('reporting.filter.applicantPlaceholder')}
                onChange={(event) => setApplicantUserFilter(event.target.value)}
              />
            </label>
            <label>
              {t('reporting.field.dateFrom')}
              <Input
                type="date"
                value={dateFromFilter}
                onChange={(event) => setDateFromFilter(event.target.value)}
              />
            </label>
            <label>
              {t('reporting.field.dateTo')}
              <Input
                type="date"
                value={dateToFilter}
                onChange={(event) => setDateToFilter(event.target.value)}
              />
            </label>
            <Button htmlType="submit" icon={<Search size={16} />} loading={loading}>
              {t('reporting.action.search')}
            </Button>
            <Button type="default" onClick={resetFilters}>
              {t('reporting.action.reset')}
            </Button>
          </form>

          <Table<ApprovalDocument>
            locale={{
              emptyText: (
                <ListEmptyState
                  emptyTitle={t('common.empty.noDataTitle')}
                  error={approvalsLoadError}
                  filtered={approvalFiltered}
                  onClearFilters={clearApprovalFilters}
                  onRetry={() => void loadApprovals()}
                />
              ),
            }}
            columns={[
              {
                title: t('reporting.table.documentNo'),
                dataIndex: 'document_no',
                render: (value: string) => <strong>{value}</strong>,
              },
              {
                title: t('reporting.table.type'),
                dataIndex: 'document_type',
                render: approvalDocumentTypeTag,
              },
              {
                title: t('reporting.table.status'),
                dataIndex: 'status',
                render: approvalStatusTag,
              },
              { title: t('reporting.table.counterparty'), dataIndex: 'counterparty_name' },
              {
                title: t('reporting.table.applicant'),
                dataIndex: 'applicant_user_name',
                render: nullableText,
              },
              {
                title: t('reporting.table.businessDate'),
                dataIndex: 'business_date',
                render: formatDate,
              },
              {
                title: t('reporting.table.submittedAt'),
                dataIndex: 'submitted_at',
                render: formatDate,
              },
              {
                title: t('reporting.table.approvedAt'),
                dataIndex: 'approved_at',
                render: formatDate,
              },
              {
                title: t('reporting.table.amount'),
                dataIndex: 'amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: t('reporting.table.actions'),
                key: 'actions',
                width: 112,
                render: (_value: unknown, record) => {
                  const targetPath = approvalDocumentPath(record)
                  if (!targetPath)
                    return <span className="muted-text">{t('reporting.table.unsupported')}</span>
                  return (
                    <Button
                      type="link"
                      size="small"
                      icon={<ArrowRight size={14} />}
                      onClick={() => onNavigate(targetPath)}
                    >
                      {record.status === 'submitted'
                        ? t('reporting.action.goApprove')
                        : t('reporting.action.viewDetail')}
                    </Button>
                  )
                },
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
          <PanelTitle
            icon={<CheckCircle2 size={18} />}
            title={t('reporting.panel.typeSummaryTitle')}
          />
          <Table<ApprovalTypeSummary>
            locale={{
              emptyText: (
                <ListEmptyState
                  emptyTitle={t('common.empty.noDataTitle')}
                  error={approvalsLoadError}
                  filtered={approvalFiltered}
                  onClearFilters={clearApprovalFilters}
                  onRetry={() => void loadApprovals()}
                />
              ),
            }}
            columns={[
              {
                title: t('reporting.metric.documentTypes'),
                dataIndex: 'document_type',
                render: approvalDocumentTypeTag,
              },
              { title: t('reporting.metric.pending'), dataIndex: 'pending_count' },
              { title: t('reporting.metric.approved'), dataIndex: 'approved_count' },
              { title: t('reporting.table.total'), dataIndex: 'total_count' },
            ]}
            dataSource={approvals?.type_summaries ?? []}
            loading={loading}
            pagination={false}
            rowKey="document_type"
            size="small"
          />
        </section>
      </section>

      <section
        className="reporting-statistics-grid"
        aria-label={t('reporting.statistics.pageAria')}
      >
        <section className="workspace-panel reporting-statistics-panel">
          <div className="panel-heading toolbar-heading">
            <PanelTitle icon={<BarChart3 size={18} />} title={t('reporting.statistics.title')} />
          </div>
          <form
            className="inline-filters"
            onSubmit={(event) => {
              event.preventDefault()
              void loadStatistics()
            }}
          >
            <label>
              {t('reporting.statistics.filter.dateFrom')}
              <Input
                type="date"
                value={statisticsDateFromFilter}
                onChange={(event) => setStatisticsDateFromFilter(event.target.value)}
              />
            </label>
            <label>
              {t('reporting.statistics.filter.dateTo')}
              <Input
                type="date"
                value={statisticsDateToFilter}
                onChange={(event) => setStatisticsDateToFilter(event.target.value)}
              />
            </label>
            <label>
              {t('reporting.statistics.filter.status')}
              <FormSelect
                value={statisticsStatusFilter}
                onChange={(event) => setStatisticsStatusFilter(event.target.value)}
              >
                <option value="">{t('reporting.filter.allStatuses')}</option>
                {exportContractStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              {t('reporting.statistics.filter.customer')}
              <Input
                value={statisticsCustomerFilter}
                placeholder={t('reporting.statistics.filter.customerPlaceholder')}
                onChange={(event) => setStatisticsCustomerFilter(event.target.value)}
              />
            </label>
            <label>
              {t('reporting.statistics.filter.supplier')}
              <Input
                value={statisticsSupplierFilter}
                placeholder={t('reporting.statistics.filter.supplierPlaceholder')}
                onChange={(event) => setStatisticsSupplierFilter(event.target.value)}
              />
            </label>
            <label>
              {t('reporting.statistics.filter.salesperson')}
              <Input
                value={statisticsSalesFilter}
                placeholder={t('reporting.statistics.filter.salespersonPlaceholder')}
                onChange={(event) => setStatisticsSalesFilter(event.target.value)}
              />
            </label>
            <Button htmlType="submit" icon={<Search size={16} />} loading={loadingStatistics}>
              {t('reporting.statistics.action.search')}
            </Button>
            <Button type="default" onClick={resetStatisticsFilters}>
              {t('reporting.statistics.action.reset')}
            </Button>
          </form>

          <div className="summary-strip reporting-stat-strip">
            <Metric
              label={t('reporting.statistics.metric.exportContract')}
              value={formatFinanceAmount(
                statisticsSummary?.export_contract_amount,
                statisticsSummary?.currency_label,
              )}
            />
            <Metric
              label={t('reporting.statistics.metric.purchaseContract')}
              value={formatFinanceAmount(
                statisticsSummary?.purchase_contract_amount,
                statisticsSummary?.currency_label,
              )}
            />
            <Metric
              label={t('reporting.statistics.metric.shipmentReceivable')}
              value={formatFinanceAmount(
                statisticsSummary?.shipment_receivable_amount,
                statisticsSummary?.currency_label,
              )}
            />
            <Metric
              label={t('reporting.statistics.metric.shipmentProfit')}
              value={formatFinanceAmount(
                statisticsSummary?.shipment_profit_amount,
                statisticsSummary?.currency_label,
              )}
            />
          </div>

          <Table<CustomerShipmentStatistic>
            locale={{
              emptyText: (
                <ListEmptyState
                  emptyTitle={t('common.empty.noDataTitle')}
                  error={statisticsLoadError}
                  filtered={statisticsFiltered}
                  onClearFilters={resetStatisticsFilters}
                  onRetry={() => void loadStatistics()}
                />
              ),
            }}
            columns={[
              { title: t('reporting.table.customer'), dataIndex: 'customer_name' },
              { title: t('reporting.table.shipmentCount'), dataIndex: 'shipment_count' },
              {
                title: t('reporting.table.receivable'),
                dataIndex: 'receivable_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: t('reporting.table.profit'),
                dataIndex: 'profit_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
              {
                title: t('reporting.table.drilldown'),
                dataIndex: 'source_path',
                render: (value: string) => sourcePathLink(value, onNavigate),
              },
            ]}
            dataSource={statistics?.customer_shipments ?? []}
            loading={loadingStatistics}
            pagination={false}
            rowKey={(record) => `${record.customer_id ?? record.customer_name}-${record.currency}`}
            size="small"
          />
        </section>

        <section className="workspace-panel reporting-stat-side-panel">
          <PanelTitle
            icon={<CheckCircle2 size={18} />}
            title={t('reporting.statistics.salesMonthlyTitle')}
          />
          <Table<SalesMonthlyShipmentStatistic>
            locale={{
              emptyText: (
                <ListEmptyState
                  emptyTitle={t('common.empty.noDataTitle')}
                  error={statisticsLoadError}
                  filtered={statisticsFiltered}
                  onClearFilters={resetStatisticsFilters}
                  onRetry={() => void loadStatistics()}
                />
              ),
            }}
            columns={[
              { title: t('reporting.table.period'), dataIndex: 'period' },
              {
                title: t('reporting.table.salesperson'),
                dataIndex: 'sales_user_name',
                render: nullableText,
              },
              { title: t('reporting.table.shipmentCount'), dataIndex: 'shipment_count' },
              {
                title: t('reporting.table.shippedAmount'),
                dataIndex: 'shipped_amount',
                render: (value: string, record) => formatFinanceAmount(value, record.currency),
              },
            ]}
            dataSource={statistics?.sales_monthly_shipments ?? []}
            loading={loadingStatistics}
            pagination={false}
            rowKey={(record) =>
              `${record.period}-${record.sales_user_id ?? '-'}-${record.currency}`
            }
            size="small"
          />
        </section>

        <section className="workspace-panel reporting-stat-side-panel">
          <PanelTitle
            icon={<ShieldCheck size={18} />}
            title={t('reporting.statistics.contractStatusTitle')}
          />
          <div className="reporting-status-stack">
            <div>
              <strong>{t('reporting.statistics.metric.exportContract')}</strong>
              <Table<StatusAmountStatistic>
                locale={{
                  emptyText: (
                    <ListEmptyState
                      emptyTitle={t('common.empty.noDataTitle')}
                      error={statisticsLoadError}
                      filtered={statisticsFiltered}
                      onClearFilters={resetStatisticsFilters}
                      onRetry={() => void loadStatistics()}
                    />
                  ),
                }}
                columns={[
                  {
                    title: t('reporting.table.status'),
                    dataIndex: 'status',
                    render: approvalStatusTag,
                  },
                  { title: t('reporting.table.count'), dataIndex: 'count' },
                  {
                    title: t('reporting.table.amount'),
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
              <strong>{t('reporting.statistics.metric.purchaseContract')}</strong>
              <Table<StatusAmountStatistic>
                locale={{
                  emptyText: (
                    <ListEmptyState
                      emptyTitle={t('common.empty.noDataTitle')}
                      error={statisticsLoadError}
                      filtered={statisticsFiltered}
                      onClearFilters={resetStatisticsFilters}
                      onRetry={() => void loadStatistics()}
                    />
                  ),
                }}
                columns={[
                  {
                    title: t('reporting.table.status'),
                    dataIndex: 'status',
                    render: approvalStatusTag,
                  },
                  { title: t('reporting.table.count'), dataIndex: 'count' },
                  {
                    title: t('reporting.table.amount'),
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
          <PanelTitle
            icon={<Search size={18} />}
            title={t('reporting.statistics.drilldownTitle')}
          />
          <div className="reporting-drilldown-stack">
            <Table<ShipmentStatisticItem>
              locale={{
                emptyText: (
                  <ListEmptyState
                    emptyTitle={t('common.empty.noDataTitle')}
                    error={statisticsLoadError}
                    filtered={statisticsFiltered}
                    onClearFilters={resetStatisticsFilters}
                    onRetry={() => void loadStatistics()}
                  />
                ),
              }}
              columns={[
                {
                  title: t('reporting.table.shipmentNo'),
                  dataIndex: 'shipment_no',
                  render: (value: string) => <strong>{value}</strong>,
                },
                { title: t('reporting.table.customer'), dataIndex: 'customer_name' },
                {
                  title: t('reporting.table.status'),
                  dataIndex: 'status',
                  render: approvalStatusTag,
                },
                {
                  title: t('reporting.table.shipmentDate'),
                  dataIndex: 'shipment_date',
                  render: formatDate,
                },
                {
                  title: t('reporting.table.receivable'),
                  dataIndex: 'receivable_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('reporting.table.profit'),
                  dataIndex: 'profit_amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('reporting.table.drilldown'),
                  dataIndex: 'source_path',
                  render: (value: string) => sourcePathLink(value, onNavigate),
                },
              ]}
              dataSource={statistics?.shipment_items ?? []}
              loading={loadingStatistics}
              pagination={false}
              rowKey="shipment_id"
              size="small"
            />
            <Table<ReportDocumentStatistic>
              locale={{
                emptyText: (
                  <ListEmptyState
                    emptyTitle={t('common.empty.noDataTitle')}
                    error={statisticsLoadError}
                    filtered={statisticsFiltered}
                    onClearFilters={resetStatisticsFilters}
                    onRetry={() => void loadStatistics()}
                  />
                ),
              }}
              columns={[
                {
                  title: t('reporting.table.exportContractNo'),
                  dataIndex: 'document_no',
                  render: (value: string) => <strong>{value}</strong>,
                },
                { title: t('reporting.table.customer'), dataIndex: 'party_name' },
                {
                  title: t('reporting.table.salesperson'),
                  dataIndex: 'business_user_name',
                  render: nullableText,
                },
                {
                  title: t('reporting.table.status'),
                  dataIndex: 'status',
                  render: approvalStatusTag,
                },
                {
                  title: t('reporting.table.amount'),
                  dataIndex: 'amount',
                  render: (value: string, record) => formatFinanceAmount(value, record.currency),
                },
                {
                  title: t('reporting.table.drilldown'),
                  dataIndex: 'source_path',
                  render: (value: string) => sourcePathLink(value, onNavigate),
                },
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
