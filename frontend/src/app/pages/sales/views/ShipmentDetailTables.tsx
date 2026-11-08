import { Table } from 'antd'

import type {
  ExportContractPurchaseStatus,
  ExportContractShipmentStatus,
  ShipmentLine,
  ShipmentPlan,
  ShipmentReminder,
} from '@/api'
import { formatDate, formatMoney, nullableText } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'

import { contractProgressStatusLabel, reminderStatusLabel } from '../shipmentHelpers'

type Props = {
  shipment: ShipmentPlan
  reminders: ShipmentReminder[]
}

export function ShipmentDetailTables({ shipment, reminders }: Props) {
  const selectedShipmentRows = shipment.contract_progresses.flatMap((progress) =>
    progress.shipment_statuses.map((status) => ({
      ...status,
      contract_id: progress.contract_id,
      contract_no: progress.contract_no,
    })),
  )
  const selectedPurchaseRows = shipment.contract_progresses.flatMap((progress) =>
    progress.purchase_statuses.map((status) => ({
      ...status,
      contract_id: progress.contract_id,
      contract_no: progress.contract_no,
    })),
  )

  return (
    <>
      <Table<ShipmentReminder>
        className="compact-section"
        columns={[
          {
            title: t('sales.shipment.field.reminderDate'),
            dataIndex: 'reminder_date',
            render: formatDate,
          },
          { title: t('sales.shipment.field.shipmentNo'), dataIndex: 'shipment_no' },
          {
            title: t('sales.shipment.field.status'),
            dataIndex: 'status',
            render: reminderStatusLabel,
          },
          { title: t('sales.shipment.field.reminderMessage'), dataIndex: 'message' },
        ]}
        dataSource={[shipment.reminder]}
        locale={{ emptyText: t('sales.shipment.detail.noCurrentReminder') }}
        pagination={false}
        rowKey={(item) => `${item.shipment_id}-${item.reminder_date}`}
        size="small"
      />

      <div className="accessory-heading">
        <strong>{t('sales.shipment.detail.linesTitle')}</strong>
        <span>
          {t('sales.shipment.detail.recordCount', {
            count: shipment.lines.length,
          })}
        </span>
      </div>
      <Table<ShipmentLine>
        columns={[
          { title: t('sales.shipment.field.contractNo'), dataIndex: 'contract_no' },
          {
            title: t('sales.shipment.field.productCode'),
            dataIndex: 'product_code',
            render: nullableText,
          },
          { title: t('sales.shipment.field.productName'), dataIndex: 'product_name' },
          {
            title: t('sales.shipment.field.specification'),
            dataIndex: 'specification',
            render: nullableText,
          },
          {
            title: t('sales.shipment.field.model'),
            dataIndex: 'model',
            render: nullableText,
          },
          {
            title: t('sales.shipment.field.shipmentQuantity'),
            dataIndex: 'quantity',
            render: (_, line) => `${line.quantity} ${line.unit}`,
          },
          {
            title: t('sales.shipment.field.amount'),
            dataIndex: 'amount',
            render: (_, line) => formatMoney(line.amount, shipment.currency),
          },
          {
            title: t('sales.shipment.field.plannedShipDate'),
            dataIndex: 'planned_ship_date',
            render: formatDate,
          },
        ]}
        dataSource={shipment.lines}
        locale={{ emptyText: t('sales.shipment.detail.noLines') }}
        pagination={false}
        rowKey="id"
        size="small"
      />

      <div className="accessory-heading">
        <strong>{t('sales.shipment.detail.contractShipmentTitle')}</strong>
        <span>
          {t('sales.shipment.detail.recordCount', {
            count: selectedShipmentRows.length,
          })}
        </span>
      </div>
      <Table<ExportContractShipmentStatus & { contract_id: string; contract_no: string }>
        columns={[
          { title: t('sales.shipment.field.contractNo'), dataIndex: 'contract_no' },
          {
            title: t('sales.shipment.field.productCode'),
            dataIndex: 'product_code',
            render: nullableText,
          },
          { title: t('sales.shipment.field.productName'), dataIndex: 'product_name' },
          { title: t('sales.shipment.field.contractQuantity'), dataIndex: 'total_quantity' },
          { title: t('sales.shipment.field.shippedQuantity'), dataIndex: 'shipped_quantity' },
          { title: t('sales.shipment.field.unshippedQuantity'), dataIndex: 'unshipped_quantity' },
          {
            title: t('sales.shipment.field.unshippedAmount'),
            dataIndex: 'unshipped_amount',
            render: (_, item) => formatMoney(item.unshipped_amount, shipment.currency),
          },
          {
            title: t('sales.shipment.field.status'),
            dataIndex: 'status',
            render: contractProgressStatusLabel,
          },
        ]}
        dataSource={selectedShipmentRows}
        locale={{ emptyText: t('sales.shipment.detail.noContractShipments') }}
        pagination={false}
        rowKey={(item) =>
          `${item.contract_id}-${item.product_id ?? item.product_code ?? item.product_name}-shipment`
        }
        size="small"
      />

      <div className="accessory-heading">
        <strong>{t('sales.shipment.detail.contractPurchaseTitle')}</strong>
        <span>
          {t('sales.shipment.detail.recordCount', {
            count: selectedPurchaseRows.length,
          })}
        </span>
      </div>
      <Table<ExportContractPurchaseStatus & { contract_id: string; contract_no: string }>
        columns={[
          { title: t('sales.shipment.field.contractNo'), dataIndex: 'contract_no' },
          {
            title: t('sales.shipment.field.productCode'),
            dataIndex: 'product_code',
            render: nullableText,
          },
          { title: t('sales.shipment.field.productName'), dataIndex: 'product_name' },
          { title: t('sales.shipment.field.contractQuantity'), dataIndex: 'total_quantity' },
          { title: t('sales.shipment.field.purchasedQuantity'), dataIndex: 'purchased_quantity' },
          {
            title: t('sales.shipment.field.unpurchasedQuantity'),
            dataIndex: 'unpurchased_quantity',
          },
          {
            title: t('sales.shipment.field.status'),
            dataIndex: 'status',
            render: contractProgressStatusLabel,
          },
        ]}
        dataSource={selectedPurchaseRows}
        locale={{ emptyText: t('sales.shipment.detail.noContractPurchases') }}
        pagination={false}
        rowKey={(item) =>
          `${item.contract_id}-${item.product_id ?? item.product_code ?? item.product_name}-purchase`
        }
        size="small"
      />

      <div className="accessory-heading">
        <strong>{t('sales.shipment.detail.reminderListTitle')}</strong>
        <span>{t('sales.shipment.detail.recordCount', { count: reminders.length })}</span>
      </div>
      <Table<ShipmentReminder>
        columns={[
          {
            title: t('sales.shipment.field.reminderDate'),
            dataIndex: 'reminder_date',
            render: formatDate,
          },
          { title: t('sales.shipment.field.shipmentNo'), dataIndex: 'shipment_no' },
          {
            title: t('sales.shipment.field.status'),
            dataIndex: 'status',
            render: reminderStatusLabel,
          },
          { title: t('sales.shipment.field.reminderMessage'), dataIndex: 'message' },
        ]}
        dataSource={reminders}
        locale={{ emptyText: t('sales.shipment.detail.noReminders') }}
        pagination={false}
        rowKey={(item) => `${item.shipment_id}-${item.reminder_date}`}
        size="small"
      />
    </>
  )
}
