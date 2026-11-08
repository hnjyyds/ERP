import { Button, Input, Table } from 'antd'
import { FileStack, Plus, Search } from 'lucide-react'
import type { MouseEvent } from 'react'

import type { PurchaseContract } from '@/api'
import { FormSelect, ListPageShell } from '@/shared/ui'
import {
  purchaseContractSourceTypeOptions,
  purchaseContractStatusOptions,
} from '@/shared/formOptions'
import { formatDate, formatMoney } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'

import {
  purchaseContractSourceTypeLabel,
  purchaseContractStatusLabel,
} from '../purchaseContractHelpers'
import type { PurchaseContractsListModel } from '../hooks/usePurchaseContractsList'

type Props = {
  model: PurchaseContractsListModel
  onCreate: () => void
  onGenerate: () => void
  onOpenDetail: (event: MouseEvent<HTMLElement>, contract: PurchaseContract) => void
}

export function PurchaseContractListPanel({ model, onCreate, onGenerate, onOpenDetail }: Props) {
  return (
    <ListPageShell
      className="product-list-panel"
      icon={<Search size={18} />}
      title={t('purchase.contract.list.title')}
      toolbar={
        <form
          className="inline-filters single-line-filter-toolbar"
          onSubmit={(event) => {
            event.preventDefault()
            model.submitFilters()
          }}
        >
          <label>
            {t('purchase.contract.list.searchLabel')}
            <Input
              value={model.search}
              placeholder={t('purchase.contract.list.searchPlaceholder')}
              onChange={(event) => model.setSearch(event.target.value)}
            />
          </label>
          <label>
            {t('purchase.contract.list.statusFilter')}
            <FormSelect
              value={model.statusFilter}
              onChange={(event) => model.setStatusFilter(event.target.value)}
            >
              <option value="">{t('purchase.contract.list.allStatuses')}</option>
              {purchaseContractStatusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(item.labelKey)}
                </option>
              ))}
            </FormSelect>
          </label>
          <label>
            {t('purchase.contract.list.sourceFilter')}
            <FormSelect
              value={model.sourceFilter}
              onChange={(event) => model.setSourceFilter(event.target.value)}
            >
              <option value="">{t('purchase.contract.list.allSources')}</option>
              {purchaseContractSourceTypeOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(item.labelKey)}
                </option>
              ))}
            </FormSelect>
          </label>
          <label>
            {t('purchase.contract.list.supplierFilter')}
            <Input
              value={model.supplierFilter}
              placeholder={t('purchase.contract.list.supplierFilterPlaceholder')}
              onChange={(event) => model.setSupplierFilter(event.target.value)}
            />
          </label>
          <Button htmlType="submit" icon={<Search size={16} />}>
            {t('purchase.contract.list.query')}
          </Button>
          <Button htmlType="button" type="primary" icon={<Plus size={16} />} onClick={onCreate}>
            {t('purchase.contract.list.create')}
          </Button>
          <Button htmlType="button" icon={<FileStack size={16} />} onClick={onGenerate}>
            {t('purchase.contract.list.generate')}
          </Button>
        </form>
      }
    >
      <Table<PurchaseContract>
        columns={[
          {
            title: t('purchase.contract.field.contract'),
            dataIndex: 'code',
            render: (value: string, record: PurchaseContract) => (
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
            title: t('purchase.contract.field.status'),
            dataIndex: 'approval_status',
            render: purchaseContractStatusLabel,
          },
          {
            title: t('purchase.contract.field.source'),
            dataIndex: 'source_type',
            render: purchaseContractSourceTypeLabel,
          },
          { title: t('purchase.contract.field.supplier'), dataIndex: 'supplier_name' },
          {
            title: t('purchase.contract.field.qcUser'),
            dataIndex: 'qc_user_name',
            render: (value: string | null) => value ?? t('common.notSet'),
          },
          {
            title: t('purchase.contract.field.deliveryDay'),
            dataIndex: 'delivery_date',
            render: formatDate,
          },
          {
            title: t('purchase.contract.field.amount'),
            dataIndex: 'statistics',
            render: (_, contract) =>
              formatMoney(contract.statistics.total_amount, contract.currency),
          },
          {
            title: t('purchase.contract.field.entry'),
            key: 'detail',
            width: 110,
            render: (_: unknown, record: PurchaseContract) => (
              <Button size="small" onClick={(event) => onOpenDetail(event, record)}>
                {t('purchase.contract.action.viewDetail')}
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
