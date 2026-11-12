import { Button, Input, Table } from 'antd'
import { Plus, Search } from 'lucide-react'

import { inboundOrderModeOptions, inboundOrderStatusOptions } from '@/shared/formOptions'
import { FormSelect, ListPageShell, RemoteSelect } from '@/shared/ui'
import { ListEmptyState } from '@/shared/ui/ListEmptyState'
import { formatDate } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import type { InboundOrder } from '@/api'

import { inboundOrderModeLabel, inboundOrderStatusLabel } from '../inboundOrderHelpers'
import type { useInboundOrdersList } from '../hooks/useInboundOrdersList'

type Props = {
  model: ReturnType<typeof useInboundOrdersList>
  onOpenModal: () => void
}

export function InboundOrderListPanel({ model, onOpenModal }: Props) {
  return (
    <ListPageShell
      className="product-list-panel"
      icon={<Search size={18} />}
      title={t('warehouse.inboundOrder.list.title')}
      toolbar={
        <form
          className="inline-filters single-line-filter-toolbar"
          onSubmit={(event) => {
            event.preventDefault()
            model.submitFilters()
          }}
        >
          <label>
            {t('warehouse.inboundOrder.list.searchLabel')}
            <Input
              value={model.search}
              placeholder={t('warehouse.inboundOrder.list.searchPlaceholder')}
              onChange={(event) => model.setSearch(event.target.value)}
            />
          </label>
          <label htmlFor="inbound-order-status-filter">
            {t('warehouse.inboundOrder.list.statusFilter')}
            <FormSelect
              id="inbound-order-status-filter"
              value={model.statusFilter}
              onChange={(event) => model.setStatusFilter(event.target.value)}
            >
              <option value="">{t('warehouse.inboundOrder.list.allStatuses')}</option>
              {inboundOrderStatusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(item.labelKey)}
                </option>
              ))}
            </FormSelect>
          </label>
          <label htmlFor="inbound-order-mode-filter">
            {t('warehouse.inboundOrder.list.modeFilter')}
            <FormSelect
              id="inbound-order-mode-filter"
              value={model.modeFilter}
              onChange={(event) => model.setModeFilter(event.target.value)}
            >
              <option value="">{t('warehouse.inboundOrder.list.allModes')}</option>
              {inboundOrderModeOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(item.labelKey)}
                </option>
              ))}
            </FormSelect>
          </label>
          <label className="entity-search-filter">
            {t('warehouse.inboundOrder.list.supplierFilter')}
            <RemoteSelect
              ariaLabel={t('warehouse.inboundOrder.list.supplierFilterAria')}
              fetchOptions={model.fetchSupplierOptions}
              placeholder={t('warehouse.inboundOrder.list.supplierFilterPlaceholder')}
              value={model.supplierFilter || null}
              onChange={(value) => {
                model.setSupplierFilter(value)
                model.setContractFilter('')
              }}
            />
          </label>
          <label className="entity-search-filter">
            {t('warehouse.inboundOrder.list.contractFilter')}
            <RemoteSelect
              ariaLabel={t('warehouse.inboundOrder.list.contractFilterAria')}
              fetchOptions={model.fetchContractOptions}
              placeholder={t('warehouse.inboundOrder.list.contractFilterPlaceholder')}
              value={model.contractFilter || null}
              onChange={model.setContractFilter}
            />
          </label>
          <Button htmlType="submit" icon={<Search size={16} />}>
            {t('warehouse.inboundOrder.list.query')}
          </Button>
          <Button
            data-testid="inbound-workflow-open"
            htmlType="button"
            type="primary"
            icon={<Plus size={16} />}
            onClick={onOpenModal}
          >
            {t('warehouse.inboundOrder.list.generateOrApprove')}
          </Button>
        </form>
      }
    >
      <Table<InboundOrder>
        locale={{
          emptyText: (
            <ListEmptyState
              createLabel={t('warehouse.inboundOrder.list.generateOrApprove')}
              emptyDescription={t('warehouse.inboundOrder.list.emptyDescription')}
              emptyTitle={t('warehouse.inboundOrder.list.emptyTitle')}
              filtered={
                Boolean(model.search.trim()) ||
                Boolean(model.statusFilter) ||
                Boolean(model.modeFilter) ||
                Boolean(model.supplierFilter) ||
                Boolean(model.contractFilter)
              }
              onCreate={onOpenModal}
              onClearFilters={model.clearFilters}
            />
          ),
        }}
        columns={[
          {
            title: t('warehouse.inboundOrder.field.code'),
            dataIndex: 'code',
            render: (value: string, record: InboundOrder) => (
              <button
                className="row-button"
                type="button"
                onClick={(event) => model.stopAndOpenInboundOrderDetail(event, record)}
              >
                {value}
              </button>
            ),
          },
          {
            title: t('warehouse.inboundOrder.field.status'),
            dataIndex: 'status',
            render: inboundOrderStatusLabel,
          },
          {
            title: t('warehouse.inboundOrder.field.mode'),
            dataIndex: 'inbound_mode',
            render: inboundOrderModeLabel,
          },
          {
            title: t('warehouse.inboundOrder.field.purchaseContract'),
            dataIndex: 'purchase_contract_no',
          },
          { title: t('warehouse.inboundOrder.field.supplier'), dataIndex: 'supplier_name' },
          {
            title: t('warehouse.inboundOrder.field.inboundDate'),
            dataIndex: 'inbound_at',
            render: formatDate,
          },
          {
            title: t('warehouse.inboundOrder.field.location'),
            dataIndex: 'location_name',
            render: (_, order) => `${order.warehouse_name} / ${order.location_name}`,
          },
          {
            title: t('warehouse.inboundOrder.field.entry'),
            key: 'detail',
            width: 110,
            render: (_: unknown, record: InboundOrder) => (
              <Button size="small" onClick={(event) => model.stopAndOpenInboundOrderDetail(event, record)}>
                {t('warehouse.inboundOrder.action.viewDetail')}
              </Button>
            ),
          },
        ]}
        dataSource={model.orders}
        loading={model.loading}
        pagination={{
          ...model.pagination,
          onChange: (nextPage, nextPageSize) => model.changeListPage(nextPage, nextPageSize),
        }}
        rowClassName={(record) => (record.id === model.selectedOrder?.id ? 'selected-row' : '')}
        rowKey="id"
        size="small"
        onRow={(record) => ({
          onClick: () => model.setSelectedOrderId(record.id),
        })}
      />
    </ListPageShell>
  )
}
