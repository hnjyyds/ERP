import { Button, Input, Table } from 'antd'
import { Plus, Search } from 'lucide-react'

import type { ShipmentPlan } from '@/api'
import { FormSelect, ListPageShell } from '@/shared/ui'
import { formatDate, formatMoney } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import { shipmentStatusOptions } from '@/shared/formOptions'

import { shipmentStatusLabel } from '../shipmentHelpers'
import type { useShipmentsList } from '../hooks/useShipmentsList'

type Props = {
  model: ReturnType<typeof useShipmentsList>
  onGenerate: () => void
}

export function ShipmentListPanel({ model, onGenerate }: Props) {
  return (
    <ListPageShell
      className="product-list-panel"
      icon={<Search size={18} />}
      title={t('sales.shipment.list.title')}
      toolbar={
        <form
          className="inline-filters"
          onSubmit={(event) => {
            event.preventDefault()
            model.submitFilters()
          }}
        >
          <label>
            {t('sales.shipment.list.searchLabel')}
            <Input
              value={model.search}
              placeholder={t('sales.shipment.list.searchPlaceholder')}
              onChange={(event) => model.setSearch(event.target.value)}
            />
          </label>
          <label>
            {t('sales.shipment.list.statusFilter')}
            <FormSelect
              value={model.statusFilter}
              onChange={(event) => model.setStatusFilter(event.target.value)}
            >
              <option value="">{t('sales.shipment.list.allStatuses')}</option>
              {shipmentStatusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(item.labelKey)}
                </option>
              ))}
            </FormSelect>
          </label>
          <label>
            {t('sales.shipment.list.customerFilter')}
            <Input
              value={model.customerFilter}
              placeholder={t('sales.shipment.list.customerFilterPlaceholder')}
              onChange={(event) => model.setCustomerFilter(event.target.value)}
            />
          </label>
          <label>
            {t('sales.shipment.list.contractFilter')}
            <Input
              value={model.contractFilter}
              placeholder={t('sales.shipment.list.contractFilterPlaceholder')}
              onChange={(event) => model.setContractFilter(event.target.value)}
            />
          </label>
          <Button htmlType="submit" icon={<Search size={16} />}>
            {t('sales.shipment.list.query')}
          </Button>
          <Button icon={<Plus size={16} />} type="primary" onClick={onGenerate}>
            {t('sales.shipment.action.generate')}
          </Button>
        </form>
      }
    >
      <Table<ShipmentPlan>
        columns={[
          {
            title: t('sales.shipment.field.code'),
            dataIndex: 'code',
            render: (value: string, record: ShipmentPlan) => (
              <button
                className="row-button"
                type="button"
                onClick={(event) => model.stopAndOpenShipmentDetail(event, record)}
              >
                {value}
              </button>
            ),
          },
          {
            title: t('sales.shipment.field.status'),
            dataIndex: 'approval_status',
            render: shipmentStatusLabel,
          },
          { title: t('sales.shipment.field.customer'), dataIndex: 'customer_name' },
          {
            title: t('sales.shipment.field.shipmentDate'),
            dataIndex: 'shipment_date',
            render: formatDate,
          },
          {
            title: t('sales.shipment.field.plannedShipDate'),
            dataIndex: 'planned_ship_date',
            render: formatDate,
          },
          {
            title: t('sales.shipment.field.receivable'),
            dataIndex: 'finance_overview',
            render: (_, shipment) =>
              formatMoney(
                shipment.finance_overview.receivable_amount,
                shipment.finance_overview.currency,
              ),
          },
          {
            title: t('sales.shipment.field.entry'),
            key: 'detail',
            width: 110,
            render: (_: unknown, record: ShipmentPlan) => (
              <Button size="small" onClick={(event) => model.stopAndOpenShipmentDetail(event, record)}>
                {t('sales.shipment.action.viewDetail')}
              </Button>
            ),
          },
        ]}
        dataSource={model.shipments}
        loading={model.loading}
        pagination={{
          ...model.pagination,
          onChange: (nextPage, nextPageSize) => model.changeListPage(nextPage, nextPageSize),
        }}
        rowClassName={(record) => (record.id === model.selectedShipment?.id ? 'selected-row' : '')}
        rowKey="id"
        size="small"
        onRow={(record) => ({
          onClick: () => model.setSelectedShipmentId(record.id),
        })}
      />
    </ListPageShell>
  )
}
