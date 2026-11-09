import { Button, Input, Table } from 'antd'
import type { TablePaginationConfig } from 'antd'
import { Plus, Search } from 'lucide-react'
import type { MouseEvent } from 'react'
import type { SampleDelivery } from '@/api'
import { t } from '@/app/appI18n'
import { FormSelect, ListPageShell } from '@/shared/ui'
import { formatMoney, nullableText } from '@/app/pages/appHelpers'
import { sampleDeliveryStatusOptions } from '@/shared/formOptions'
import { sampleDeliveryStatusLabel } from '../sampleDeliveryHelpers'

type Props = {
  deliveries: SampleDelivery[]
  loading: boolean
  selectedId?: string
  submitting: boolean
  search: string
  statusFilter: string
  customerFilter: string
  expressFilter: string
  dateFromFilter: string
  dateToFilter: string
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
  onCustomerChange: (value: string) => void
  onExpressChange: (value: string) => void
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onQuery: () => void
  pagination: TablePaginationConfig
  total: number
  onPageChange: (page: number, pageSize: number) => void
  onExport: () => void
  onCreate: () => void
  onOpenDetail: (event: MouseEvent<HTMLElement>, delivery: SampleDelivery) => void
  onSelect: (id: string) => void
}

export function SampleDeliveryListView({
  deliveries,
  loading,
  selectedId,
  submitting,
  search,
  statusFilter,
  customerFilter,
  expressFilter,
  dateFromFilter,
  dateToFilter,
  onSearchChange,
  onStatusChange,
  onCustomerChange,
  onExpressChange,
  onDateFromChange,
  onDateToChange,
  onQuery,
  pagination,
  total,
  onPageChange,
  onExport,
  onCreate,
  onOpenDetail,
  onSelect,
}: Props) {
  return (
    <ListPageShell
      className="product-list-panel"
      icon={<Search size={18} />}
      title={t('sample.delivery.panel.listTitle')}
      toolbar={
        <form
          className="inline-filters"
          onSubmit={(event) => {
            event.preventDefault()
            onQuery()
          }}
        >
          <label className="inline-filter-search">
            {t('sample.delivery.filter.search')}
            <Input
              value={search}
              placeholder={t('sample.delivery.filter.searchPlaceholder')}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </label>
          <label className="inline-filter-compact" htmlFor="sample-delivery-status-filter">
            {t('sample.delivery.filter.status')}
            <FormSelect
              id="sample-delivery-status-filter"
              value={statusFilter}
              onChange={(event) => onStatusChange(event.target.value)}
            >
              <option value="">{t('sample.delivery.filter.allStatuses')}</option>
              {sampleDeliveryStatusOptions
                .filter((item) => item.value !== 'rejected')
                .map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </option>
                ))}
            </FormSelect>
          </label>
          <label className="inline-filter-compact">
            {t('sample.delivery.field.customerId')}
            <Input
              value={customerFilter}
              placeholder={t('sample.delivery.filter.customerPlaceholder')}
              onChange={(event) => onCustomerChange(event.target.value)}
            />
          </label>
          <label className="inline-filter-compact">
            {t('sample.delivery.field.expressCompany')}
            <Input
              value={expressFilter}
              placeholder={t('sample.delivery.filter.expressPlaceholder')}
              onChange={(event) => onExpressChange(event.target.value)}
            />
          </label>
          <label className="inline-filter-compact">
            {t('sample.delivery.filter.dateFrom')}
            <Input
              type="date"
              value={dateFromFilter}
              onChange={(event) => onDateFromChange(event.target.value)}
            />
          </label>
          <label className="inline-filter-compact">
            {t('sample.delivery.filter.dateTo')}
            <Input
              type="date"
              value={dateToFilter}
              onChange={(event) => onDateToChange(event.target.value)}
            />
          </label>
          <Button htmlType="submit" icon={<Search size={16} />}>
            {t('sample.delivery.action.query')}
          </Button>
          <Button loading={submitting} onClick={onExport}>
            {t('sample.delivery.action.export')}
          </Button>
          <Button htmlType="button" type="primary" icon={<Plus size={16} />} onClick={onCreate}>
            {t('sample.delivery.action.create')}
          </Button>
        </form>
      }
    >
      <Table<SampleDelivery>
        columns={[
          {
            title: t('sample.delivery.table.code'),
            dataIndex: 'code',
            render: (value: string, record: SampleDelivery) => (
              <button
                className="row-button"
                type="button"
                onClick={(event) => onOpenDetail(event, record)}
              >
                {value}
              </button>
            ),
          },
          {
            title: t('sample.delivery.table.status'),
            dataIndex: 'status',
            render: sampleDeliveryStatusLabel,
          },
          { title: t('sample.delivery.table.customer'), dataIndex: 'customer_name' },
          {
            title: t('sample.delivery.table.express'),
            dataIndex: 'express_company',
            render: (_, record) =>
              `${record.express_company} / ${record.tracking_no ?? t('sample.delivery.panel.notFilled')}`,
          },
          { title: t('sample.delivery.table.quote'), dataIndex: 'quote_no', render: nullableText },
          {
            title: t('sample.delivery.table.fee'),
            dataIndex: 'fee_total',
            render: (_, record) => formatMoney(record.fee_total, record.fees[0]?.currency ?? 'USD'),
          },
          {
            title: t('sample.delivery.table.entry'),
            key: 'detail',
            width: 110,
            render: (_: unknown, record: SampleDelivery) => (
              <Button size="small" onClick={(event) => onOpenDetail(event, record)}>
                {t('sample.delivery.action.viewDetail')}
              </Button>
            ),
          },
        ]}
        dataSource={deliveries}
        loading={loading}
        pagination={{
          ...pagination,
          total,
          onChange: (nextPage, nextPageSize) => onPageChange(nextPage, nextPageSize),
        }}
        rowClassName={(record) => (record.id === selectedId ? 'selected-row' : '')}
        rowKey="id"
        size="small"
        onRow={(record) => ({
          onClick: () => onSelect(record.id),
        })}
      />
    </ListPageShell>
  )
}
