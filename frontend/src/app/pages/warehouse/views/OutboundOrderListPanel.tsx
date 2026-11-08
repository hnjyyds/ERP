import { Button, Input, Table } from 'antd'
import { Plus, Search } from 'lucide-react'

import {
  outboundOrderModeOptions,
  outboundOrderStatusOptions,
  outboundPlanTypeOptions,
} from '@/shared/formOptions'
import { FormSelect, ListPageShell } from '@/shared/ui'
import { formatDate, nullableText } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import type { OutboundOrder } from '@/api'

import {
  outboundOrderModeLabel,
  outboundOrderStatusLabel,
  outboundOrderTotalQuantity,
  outboundPlanTypeLabel,
} from '../outboundOrderHelpers'
import type { useOutboundOrdersList } from '../hooks/useOutboundOrdersList'

type Props = {
  model: ReturnType<typeof useOutboundOrdersList>
  onOpenModal: () => void
}

export function OutboundOrderListPanel({ model, onOpenModal }: Props) {
  return (
    <ListPageShell
      className="product-list-panel"
      icon={<Search size={18} />}
      title={t('warehouse.outboundOrder.list.title')}
      toolbar={
        <form
          className="inline-filters"
          onSubmit={(event) => {
            event.preventDefault()
            model.submitFilters()
          }}
        >
          <label>
            {t('warehouse.outboundOrder.list.searchLabel')}
            <Input
              value={model.search}
              placeholder={t('warehouse.outboundOrder.list.searchPlaceholder')}
              onChange={(event) => model.setSearch(event.target.value)}
            />
          </label>
          <label htmlFor="outbound-order-status-filter">
            {t('warehouse.outboundOrder.list.statusFilter')}
            <FormSelect
              id="outbound-order-status-filter"
              value={model.statusFilter}
              onChange={(event) => model.setStatusFilter(event.target.value)}
            >
              <option value="">{t('warehouse.outboundOrder.list.allStatuses')}</option>
              {outboundOrderStatusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(item.labelKey)}
                </option>
              ))}
            </FormSelect>
          </label>
          <label htmlFor="outbound-order-mode-filter">
            {t('warehouse.outboundOrder.list.modeFilter')}
            <FormSelect
              id="outbound-order-mode-filter"
              value={model.modeFilter}
              onChange={(event) => model.setModeFilter(event.target.value)}
            >
              <option value="">{t('warehouse.outboundOrder.list.allModes')}</option>
              {outboundOrderModeOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(item.labelKey)}
                </option>
              ))}
            </FormSelect>
          </label>
          <label htmlFor="outbound-order-type-filter">
            {t('warehouse.outboundOrder.list.typeFilter')}
            <FormSelect
              id="outbound-order-type-filter"
              value={model.typeFilter}
              onChange={(event) => model.setTypeFilter(event.target.value)}
            >
              <option value="">{t('warehouse.outboundOrder.list.allTypes')}</option>
              {outboundPlanTypeOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(item.labelKey)}
                </option>
              ))}
            </FormSelect>
          </label>
          <label>
            {t('warehouse.outboundOrder.list.customerFilter')}
            <Input
              value={model.customerFilter}
              placeholder={t('warehouse.outboundOrder.list.customerFilterPlaceholder')}
              onChange={(event) => model.setCustomerFilter(event.target.value)}
            />
          </label>
          <label>
            {t('warehouse.outboundOrder.list.sourceIdFilter')}
            <Input
              value={model.sourceIdFilter}
              placeholder={t('warehouse.outboundOrder.list.sourceIdFilterPlaceholder')}
              onChange={(event) => model.setSourceIdFilter(event.target.value)}
            />
          </label>
          <Button htmlType="submit" icon={<Search size={16} />}>
            {t('warehouse.outboundOrder.list.query')}
          </Button>
          <Button htmlType="button" type="primary" icon={<Plus size={16} />} onClick={onOpenModal}>
            {t('warehouse.outboundOrder.list.generateOrApprove')}
          </Button>
        </form>
      }
    >
      <Table<OutboundOrder>
        columns={[
          {
            title: t('warehouse.outboundOrder.field.code'),
            dataIndex: 'code',
            render: (value: string, record: OutboundOrder) => (
              <button
                className="row-button"
                type="button"
                onClick={(event) => model.stopAndOpenOutboundOrderDetail(event, record)}
              >
                {value}
              </button>
            ),
          },
          {
            title: t('warehouse.outboundOrder.field.status'),
            dataIndex: 'status',
            render: outboundOrderStatusLabel,
          },
          {
            title: t('warehouse.outboundOrder.field.mode'),
            dataIndex: 'outbound_mode',
            render: outboundOrderModeLabel,
          },
          {
            title: t('warehouse.outboundOrder.field.outboundType'),
            dataIndex: 'outbound_type',
            render: outboundPlanTypeLabel,
          },
          { title: t('warehouse.outboundOrder.field.sourceCode'), dataIndex: 'source_code' },
          {
            title: t('warehouse.outboundOrder.field.customer'),
            dataIndex: 'customer_name',
            render: nullableText,
          },
          {
            title: t('warehouse.outboundOrder.field.outboundDate'),
            dataIndex: 'outbound_at',
            render: formatDate,
          },
          {
            title: t('warehouse.outboundOrder.field.quantity'),
            dataIndex: 'lines',
            render: (_, order) => outboundOrderTotalQuantity(order).toFixed(2),
          },
          {
            title: t('warehouse.outboundOrder.field.entry'),
            key: 'detail',
            width: 110,
            render: (_: unknown, record: OutboundOrder) => (
              <Button
                size="small"
                onClick={(event) => model.stopAndOpenOutboundOrderDetail(event, record)}
              >
                {t('warehouse.outboundOrder.action.viewDetail')}
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
