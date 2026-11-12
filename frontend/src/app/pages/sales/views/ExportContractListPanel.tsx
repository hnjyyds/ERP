import { Button, Input, Select, Table } from 'antd'
import { Plus, Search } from 'lucide-react'
import type { MouseEvent } from 'react'

import type { Customer, ExportContract } from '@/api'
import { FormSelect, ListPageShell } from '@/shared/ui'
import { ListEmptyState } from '@/shared/ui/ListEmptyState'
import { exportContractStatusOptions } from '@/shared/formOptions'
import { formatDate, formatMoney } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'

import {
  exportContractStatusLabel,
  renderCustomerOptions,
  signatureStatusLabel,
} from '../exportContractHelpers'
import type { ExportContractsListModel } from '../hooks/useExportContractsList'

type Props = {
  model: ExportContractsListModel
  customers: Customer[]
  loadingCustomers: boolean
  onCustomerSearch: (query: string) => void
  onCreate: () => void
  onOpenDetail: (event: MouseEvent<HTMLElement>, contract: ExportContract) => void
}

export function ExportContractListPanel({
  model,
  customers,
  loadingCustomers,
  onCustomerSearch,
  onCreate,
  onOpenDetail,
}: Props) {
  return (
    <ListPageShell
      className="product-list-panel"
      icon={<Search size={18} />}
      style={{ gridColumn: '1 / -1' }}
      title={t('sales.contract.list.title')}
    >
      <form
        className="inline-filters single-line-filter-toolbar"
        onSubmit={(event) => {
          event.preventDefault()
          model.submitFilters()
        }}
      >
        <label>
          {t('sales.contract.list.searchLabel')}
          <Input
            value={model.search}
            placeholder={t('sales.contract.list.searchPlaceholder')}
            onChange={(event) => model.setSearch(event.target.value)}
          />
        </label>
        <label>
          {t('sales.contract.list.statusFilter')}
          <FormSelect
            id="export-contract-status-filter"
            value={model.statusFilter}
            onChange={(event) => model.setStatusFilter(event.target.value)}
          >
            <option value="">{t('sales.contract.list.allStatuses')}</option>
            {exportContractStatusOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {t(item.labelKey)}
              </option>
            ))}
          </FormSelect>
        </label>
        <label>
          {t('sales.contract.list.customerFilter')}
          <Select
            allowClear
            showSearch
            loading={loadingCustomers}
            value={model.customerFilter || undefined}
            placeholder={t('sales.contract.list.customerFilterPlaceholder')}
            optionLabelProp="label"
            filterOption={false}
            notFoundContent={
              loadingCustomers
                ? t('sales.contract.list.loadingCustomers')
                : t('sales.contract.list.noCustomers')
            }
            placement="bottomRight"
            popupMatchSelectWidth={360}
            onSearch={onCustomerSearch}
            onChange={(value) => model.setCustomerFilter(value ?? '')}
          >
            {model.customerFilter &&
            !customers.some((customer) => customer.id === model.customerFilter) ? (
              <Select.Option key={model.customerFilter} value={model.customerFilter}>
                {model.customerFilter}
              </Select.Option>
            ) : null}
            {renderCustomerOptions(customers)}
          </Select>
        </label>
        <Button htmlType="submit" icon={<Search size={16} />}>
          {t('sales.contract.list.query')}
        </Button>
        <Button type="primary" icon={<Plus size={16} />} onClick={onCreate}>
          {t('sales.contract.list.create')}
        </Button>
      </form>

      <Table<ExportContract>
        locale={{
          emptyText: (
            <ListEmptyState
              createLabel={t('sales.contract.list.create')}
              emptyTitle={t('sales.contract.list.emptyTitle')}
              filtered={
                Boolean(model.search.trim()) ||
                Boolean(model.statusFilter) ||
                Boolean(model.customerFilter)
              }
              onCreate={onCreate}
              onClearFilters={model.clearFilters}
            />
          ),
        }}
        columns={[
          {
            title: t('sales.contract.field.code'),
            dataIndex: 'code',
            render: (value: string, record: ExportContract) => (
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
            title: t('sales.contract.field.status'),
            dataIndex: 'approval_status',
            render: exportContractStatusLabel,
          },
          { title: t('sales.contract.field.customer'), dataIndex: 'customer_name' },
          {
            title: t('sales.contract.field.plannedShipDate'),
            dataIndex: 'planned_ship_date',
            render: formatDate,
          },
          {
            title: t('sales.contract.field.amount'),
            dataIndex: 'statistics',
            render: (_, contract) =>
              formatMoney(contract.statistics.total_amount, contract.currency),
          },
          {
            title: t('sales.contract.field.signature'),
            dataIndex: 'signature_status',
            render: signatureStatusLabel,
          },
          {
            title: t('sales.contract.field.entry'),
            key: 'detail',
            width: 110,
            render: (_: unknown, record: ExportContract) => (
              <Button size="small" onClick={(event) => onOpenDetail(event, record)}>
                {t('sales.contract.action.viewDetail')}
              </Button>
            ),
          },
        ]}
        dataSource={model.contracts}
        loading={model.loading}
        pagination={{
          ...model.pagination,
          onChange: (nextPage, nextPageSize) => {
            model.changeContractsPage(nextPage, nextPageSize)
          },
        }}
        rowClassName={(record) =>
          record.id === model.selectedContract?.id ? 'selected-row' : ''
        }
        rowKey="id"
        size="small"
        onRow={(record) => ({
          onClick: () => model.setSelectedContractId(record.id),
        })}
      />
    </ListPageShell>
  )
}
