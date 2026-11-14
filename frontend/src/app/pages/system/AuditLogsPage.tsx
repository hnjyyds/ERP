import { Button, DatePicker, Input, Select, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import { Download, ScrollText } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { exportAuditLogs, listAuditLogs, type AuditLogItem, type AuditLogQuery } from '@/api'
import { t } from '@/app/appI18n'
import { formatDateTime } from '@/app/pages/appHelpers'
import { showError, showSuccess } from '@/shared/errors'
import { downloadCsv } from '@/shared/print'
import { ListPageShell } from '@/shared/ui'
import { useTablePagination } from '@/shared/useTablePagination'

type AuditFilters = {
  actor?: string
  resourceType?: string
  action?: string
  keyword?: string
  range: [Dayjs | null, Dayjs | null] | null
}

const EMPTY_FILTERS: AuditFilters = { range: null }

const RESOURCE_OPTIONS = [
  { value: 'product', labelKey: 'auditLogs.resource.product' },
  { value: 'customer', labelKey: 'auditLogs.resource.customer' },
  { value: 'supplier', labelKey: 'auditLogs.resource.supplier' },
  { value: 'partner', labelKey: 'auditLogs.resource.partner' },
  { value: 'export_quotation', labelKey: 'auditLogs.resource.export_quotation' },
  { value: 'export_contract', labelKey: 'auditLogs.resource.export_contract' },
  { value: 'purchase_contract', labelKey: 'auditLogs.resource.purchase_contract' },
  { value: 'sample_delivery', labelKey: 'auditLogs.resource.sample_delivery' },
  { value: 'shipment', labelKey: 'auditLogs.resource.shipment' },
  { value: 'inbound_order', labelKey: 'auditLogs.resource.inbound_order' },
  { value: 'outbound_order', labelKey: 'auditLogs.resource.outbound_order' },
  { value: 'payment_request', labelKey: 'auditLogs.resource.payment_request' },
  { value: 'fee_payment_request', labelKey: 'auditLogs.resource.fee_payment_request' },
  { value: 'reimbursement', labelKey: 'auditLogs.resource.reimbursement' },
] as const

const ACTION_OPTIONS = [
  { value: 'create', labelKey: 'auditLogs.action.create' },
  { value: 'update', labelKey: 'auditLogs.action.update' },
  { value: 'delete', labelKey: 'auditLogs.action.delete' },
  { value: 'submit', labelKey: 'auditLogs.action.submit' },
  { value: 'approve', labelKey: 'auditLogs.action.approve' },
  { value: 'reject', labelKey: 'auditLogs.action.reject' },
  { value: 'withdraw', labelKey: 'auditLogs.action.withdraw' },
  { value: 'cancel', labelKey: 'auditLogs.action.cancel' },
  { value: 'reopen', labelKey: 'auditLogs.action.reopen' },
] as const

function resourceLabel(value: string): string {
  const option = RESOURCE_OPTIONS.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function actionLabel(value: string): string {
  const option = ACTION_OPTIONS.find((item) => item.value === value)
  return option ? t(option.labelKey) : value
}

function toQuery(
  filters: AuditFilters,
  page?: number,
  pageSize?: number,
): AuditLogQuery {
  const query: AuditLogQuery = {
    actor: filters.actor?.trim() || undefined,
    resource_type: filters.resourceType,
    action: filters.action,
    keyword: filters.keyword?.trim() || undefined,
    created_from: filters.range?.[0]?.startOf('day').toISOString(),
    created_to: filters.range?.[1]?.endOf('day').toISOString(),
  }
  if (page !== undefined && pageSize !== undefined) {
    query.limit = pageSize
    query.offset = (page - 1) * pageSize
  }
  return query
}

export function AuditLogsPage() {
  const [filters, setFilters] = useState<AuditFilters>(EMPTY_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<AuditFilters>(EMPTY_FILTERS)
  const [items, setItems] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const { page, pageSize, total, setTotal, resetPage, changePage, pagination } =
    useTablePagination()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listAuditLogs(toQuery(appliedFilters, page, pageSize))
      setItems(result.items)
      setTotal(result.total)
    } catch (error) {
      showError(error, t('auditLogs.message.loadFailed'))
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [appliedFilters, page, pageSize, setTotal])

  useEffect(() => {
    void load()
  }, [load])

  async function exportCsv() {
    setExporting(true)
    try {
      const result = await exportAuditLogs(toQuery(appliedFilters))
      downloadCsv(result.filename, result.content)
      showSuccess(t('auditLogs.message.exported', { count: total }))
    } catch (error) {
      showError(error, t('auditLogs.message.exportFailed'))
    } finally {
      setExporting(false)
    }
  }

  function search() {
    resetPage()
    setAppliedFilters({ ...filters })
  }

  function reset() {
    resetPage()
    setFilters(EMPTY_FILTERS)
    setAppliedFilters(EMPTY_FILTERS)
  }

  const columns = useMemo<ColumnsType<AuditLogItem>>(
    () => [
      {
        title: t('auditLogs.table.createdAt'),
        dataIndex: 'created_at',
        width: 170,
        render: (value: string) => formatDateTime(value),
      },
      {
        title: t('auditLogs.table.actor'),
        dataIndex: 'actor_name',
        width: 160,
        render: (_value: string, row) => (
          <div>
            <div>{row.actor_name}</div>
            <div style={{ color: 'var(--app-muted)', fontSize: 12 }}>{row.actor_user_id}</div>
          </div>
        ),
      },
      {
        title: t('auditLogs.table.resourceType'),
        dataIndex: 'resource_type',
        width: 120,
        render: (value: string) => resourceLabel(value),
      },
      {
        title: t('auditLogs.table.action'),
        dataIndex: 'action',
        width: 100,
        render: (value: string) => <Tag>{actionLabel(value)}</Tag>,
      },
      {
        title: t('auditLogs.table.resourceNo'),
        dataIndex: 'resource_no',
        width: 180,
        render: (value: string | null) => value || '-',
      },
      {
        title: t('auditLogs.table.summary'),
        dataIndex: 'summary',
      },
    ],
    [],
  )

  return (
    <ListPageShell
      className="audit-page"
      icon={<ScrollText size={18} />}
      title={t('auditLogs.title')}
      toolbar={
        <Button
          disabled={exporting}
          icon={<Download size={16} />}
          onClick={() => void exportCsv()}
        >
          {t('auditLogs.filter.export')}
        </Button>
      }
    >
      <p style={{ margin: '0 0 var(--ui-space-3)', color: 'var(--ui-text-secondary)' }}>
        {t('auditLogs.description')}
      </p>

      <form
        className="audit-filters"
        onSubmit={(event) => {
          event.preventDefault()
          search()
        }}
      >
        <label className="audit-filter-field audit-filter-actor">
          <span>{t('auditLogs.filter.actor')}</span>
          <Input
            allowClear
            placeholder={t('auditLogs.filter.actorPlaceholder')}
            value={filters.actor ?? ''}
            onChange={(event) => setFilters({ ...filters, actor: event.target.value })}
          />
        </label>
        <label className="audit-filter-field audit-filter-resource">
          <span>{t('auditLogs.filter.resource')}</span>
          <Select
            allowClear
            placeholder={t('auditLogs.filter.resourcePlaceholder')}
            value={filters.resourceType}
            options={RESOURCE_OPTIONS.map(({ value, labelKey }) => ({
              value,
              label: t(labelKey),
            }))}
            onChange={(value?: string) => setFilters({ ...filters, resourceType: value })}
          />
        </label>
        <label className="audit-filter-field audit-filter-action">
          <span>{t('auditLogs.filter.action')}</span>
          <Select
            allowClear
            placeholder={t('auditLogs.filter.actionPlaceholder')}
            value={filters.action}
            options={ACTION_OPTIONS.map(({ value, labelKey }) => ({
              value,
              label: t(labelKey),
            }))}
            onChange={(value?: string) => setFilters({ ...filters, action: value })}
          />
        </label>
        <label className="audit-filter-field audit-filter-keyword">
          <span>{t('auditLogs.filter.keyword')}</span>
          <Input
            allowClear
            placeholder={t('auditLogs.filter.keywordPlaceholder')}
            value={filters.keyword ?? ''}
            onChange={(event) => setFilters({ ...filters, keyword: event.target.value })}
          />
        </label>
        <label className="audit-filter-field audit-filter-range">
          <span>{t('auditLogs.filter.dateRange')}</span>
          <DatePicker.RangePicker
            value={filters.range}
            onChange={(range) => setFilters({ ...filters, range })}
          />
        </label>
        <div className="filter-actions">
          <Button htmlType="submit" loading={loading} type="primary">
            {t('auditLogs.filter.search')}
          </Button>
          <Button onClick={reset}>{t('auditLogs.filter.reset')}</Button>
        </div>
      </form>

      <Table<AuditLogItem>
        columns={columns}
        dataSource={items}
        loading={loading}
        rowKey="id"
        size="middle"
        scroll={{ x: 900 }}
        pagination={{
          ...pagination,
          onChange: (nextPage, nextPageSize) => {
            changePage(nextPage, nextPageSize)
          },
        }}
      />
    </ListPageShell>
  )
}
