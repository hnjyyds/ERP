import { Button, Input, Select, Table } from 'antd'
import { Plus, Search } from 'lucide-react'

import { exportQuotationStatusOptions } from '@/shared/formOptions'
import { FormSelect, ListPageShell } from '@/shared/ui'
import { formatMoney, nullableText } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import type { ExportQuotation } from '@/api'

import { exportQuotationStatusLabel, renderCustomerOptions } from '../exportQuotationHelpers'
import type { useExportQuotationsList } from '../hooks/useExportQuotationsList'

type Props = {
  model: ReturnType<typeof useExportQuotationsList>
  onOpenForm: () => void
}

export function ExportQuotationListPanel({ model, onOpenForm }: Props) {
  return (
    <ListPageShell
      className="product-list-panel"
      icon={<Search size={18} />}
      title={t('sales.quotation.list.title')}
      toolbar={
        <form
          className="inline-filters"
          onSubmit={(event) => {
            event.preventDefault()
            model.submitFilters()
          }}
        >
          <label>
            {t('sales.quotation.list.searchLabel')}
            <Input
              value={model.search}
              placeholder={t('sales.quotation.list.searchPlaceholder')}
              onChange={(event) => model.setSearch(event.target.value)}
            />
          </label>
          <label htmlFor="export-quotation-status-filter">
            {t('sales.quotation.list.statusFilter')}
            <FormSelect
              value={model.statusFilter}
              onChange={(event) => model.setStatusFilter(event.target.value)}
            >
              <option value="">{t('sales.quotation.list.allStatuses')}</option>
              {exportQuotationStatusOptions
                .filter((item) => item.value !== 'rejected')
                .map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </option>
                ))}
            </FormSelect>
          </label>
          <label>
            {t('sales.quotation.list.customerFilter')}
            <Select
              allowClear
              showSearch
              loading={model.loadingCustomers}
              value={model.customerFilter || undefined}
              placeholder={t('sales.quotation.list.customerFilterPlaceholder')}
              filterOption={false}
              notFoundContent={
                model.loadingCustomers
                  ? t('sales.quotation.list.loadingCustomers')
                  : t('sales.quotation.list.noCustomers')
              }
              onSearch={(value) => {
                void model.loadQuotationCustomerOptions(value)
              }}
              onChange={(value) => model.setCustomerFilter(value ?? '')}
            >
              {model.customerFilter &&
              !model.customers.some((customer) => customer.id === model.customerFilter) ? (
                <Select.Option key={model.customerFilter} value={model.customerFilter}>
                  {model.customerFilter}
                </Select.Option>
              ) : null}
              {renderCustomerOptions(model.customers)}
            </Select>
          </label>
          <Button htmlType="submit" icon={<Search size={16} />}>
            {t('sales.quotation.list.query')}
          </Button>
          <Button icon={<Plus size={16} />} type="primary" onClick={onOpenForm}>
            {t('sales.quotation.list.create')}
          </Button>
        </form>
      }
    >
      <Table<ExportQuotation>
        columns={[
          {
            title: t('sales.quotation.field.code'),
            dataIndex: 'code',
            render: (value: string, record: ExportQuotation) => (
              <button
                className="row-button"
                type="button"
                onClick={(event) => model.stopAndOpenQuotationDetail(event, record)}
              >
                {value}
              </button>
            ),
          },
          {
            title: t('sales.quotation.field.status'),
            dataIndex: 'approval_status',
            render: exportQuotationStatusLabel,
          },
          { title: t('sales.quotation.field.customer'), dataIndex: 'customer_name' },
          { title: t('sales.quotation.field.tradeTerm'), dataIndex: 'trade_term' },
          {
            title: t('sales.quotation.field.amount'),
            dataIndex: 'total_amount',
            render: (_, quotation) => formatMoney(quotation.total_amount, quotation.currency),
          },
          {
            title: t('sales.quotation.field.contract'),
            dataIndex: 'generated_contract_no',
            render: nullableText,
          },
          {
            title: t('sales.quotation.field.entry'),
            key: 'detail',
            width: 110,
            render: (_: unknown, record: ExportQuotation) => (
              <Button
                size="small"
                onClick={(event) => model.stopAndOpenQuotationDetail(event, record)}
              >
                {t('sales.quotation.action.viewDetail')}
              </Button>
            ),
          },
        ]}
        dataSource={model.quotations}
        loading={model.loading}
        pagination={{
          ...model.pagination,
          onChange: (nextPage, nextPageSize) => model.changeListPage(nextPage, nextPageSize),
        }}
        rowClassName={(record) =>
          record.id === model.selectedQuotation?.id ? 'selected-row' : ''
        }
        rowKey="id"
        size="small"
        onRow={(record) => ({
          onClick: () => model.setSelectedQuotationId(record.id),
        })}
      />
    </ListPageShell>
  )
}
