import { Table } from 'antd'

import type {
  ExportContract,
  ExportContractAdvancePayment,
  ExportContractPurchaseStatus,
  ExportContractShipmentStatus,
  ExportContractSignature,
  ExportQuotation,
} from '@/api'
import { formatDate, formatMoney, nullableText } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'

import { contractProgressStatusLabel } from '../exportContractHelpers'

type Props = {
  contract: ExportContract
  history: ExportQuotation[]
}

/** 出口合同详情下方的客户历史、采购进度、发运进度、签署与预收款表格。 */
export function ExportContractDetailTables({ contract, history }: Props) {
  return (
    <>
      <div className="accessory-heading">
        <strong>{t('sales.contract.detail.historyTitle')}</strong>
        <span>{t('sales.contract.detail.recordCount', { count: history.length })}</span>
      </div>
      <Table<ExportQuotation>
        columns={[
          { title: t('sales.contract.field.quotation'), dataIndex: 'code' },
          { title: t('sales.contract.field.customer'), dataIndex: 'customer_name' },
          { title: t('sales.contract.field.date'), dataIndex: 'quote_date', render: formatDate },
          {
            title: t('sales.contract.field.amount'),
            dataIndex: 'total_amount',
            render: (_, quotation) =>
              formatMoney(quotation.total_amount, quotation.currency),
          },
        ]}
        dataSource={history}
        locale={{ emptyText: t('sales.contract.detail.noHistory') }}
        pagination={false}
        rowKey="id"
        size="small"
      />

      <div className="accessory-heading">
        <strong>{t('sales.contract.detail.purchaseTitle')}</strong>
        <span>
          {t('sales.contract.detail.recordCount', {
            count: contract.purchase_statuses.length,
          })}
        </span>
      </div>
      <Table<ExportContractPurchaseStatus>
        columns={[
          {
            title: t('sales.contract.field.productCode'),
            dataIndex: 'product_code',
            render: nullableText,
          },
          { title: t('sales.contract.field.productName'), dataIndex: 'product_name' },
          { title: t('sales.contract.field.contractQuantity'), dataIndex: 'total_quantity' },
          {
            title: t('sales.contract.field.purchasedQuantity'),
            dataIndex: 'purchased_quantity',
          },
          { title: t('sales.contract.field.unpurchased'), dataIndex: 'unpurchased_quantity' },
          {
            title: t('sales.contract.field.status'),
            dataIndex: 'status',
            render: contractProgressStatusLabel,
          },
        ]}
        dataSource={contract.purchase_statuses}
        locale={{ emptyText: t('sales.contract.detail.noPurchase') }}
        pagination={false}
        rowKey={(item) =>
          `${item.product_id ?? item.product_code ?? item.product_name}-purchase`
        }
        size="small"
      />

      <div className="accessory-heading">
        <strong>{t('sales.contract.detail.shipmentTitle')}</strong>
        <span>
          {t('sales.contract.detail.recordCount', {
            count: contract.shipment_statuses.length,
          })}
        </span>
      </div>
      <Table<ExportContractShipmentStatus>
        columns={[
          {
            title: t('sales.contract.field.productCode'),
            dataIndex: 'product_code',
            render: nullableText,
          },
          { title: t('sales.contract.field.productName'), dataIndex: 'product_name' },
          {
            title: t('sales.contract.field.plannedShipDate'),
            dataIndex: 'planned_ship_date',
            render: formatDate,
          },
          { title: t('sales.contract.field.contractQuantity'), dataIndex: 'total_quantity' },
          { title: t('sales.contract.field.shippedQuantity'), dataIndex: 'shipped_quantity' },
          { title: t('sales.contract.field.unshipped'), dataIndex: 'unshipped_quantity' },
          {
            title: t('sales.contract.field.unshippedAmount'),
            dataIndex: 'unshipped_amount',
            render: (_, item) => formatMoney(item.unshipped_amount, contract.currency),
          },
          {
            title: t('sales.contract.field.status'),
            dataIndex: 'status',
            render: contractProgressStatusLabel,
          },
        ]}
        dataSource={contract.shipment_statuses}
        locale={{ emptyText: t('sales.contract.detail.noShipment') }}
        pagination={false}
        rowKey={(item) =>
          `${item.product_id ?? item.product_code ?? item.product_name}-shipment`
        }
        size="small"
      />

      <div className="accessory-heading">
        <strong>{t('sales.contract.detail.signatureTitle')}</strong>
        <span>
          {t('sales.contract.detail.recordCount', { count: contract.signatures.length })}
        </span>
      </div>
      <Table<ExportContractSignature>
        columns={[
          { title: t('sales.contract.field.signedBy'), dataIndex: 'signed_by' },
          { title: t('sales.contract.field.signedAt'), dataIndex: 'signed_at', render: formatDate },
          { title: t('sales.contract.field.method'), dataIndex: 'signature_method' },
          { title: t('sales.contract.field.fileNo'), dataIndex: 'file_no', render: nullableText },
          { title: t('sales.contract.field.remark'), dataIndex: 'remark', render: nullableText },
        ]}
        dataSource={contract.signatures}
        locale={{ emptyText: t('sales.contract.detail.noSignatures') }}
        pagination={false}
        rowKey="id"
        size="small"
      />

      <div className="accessory-heading">
        <strong>{t('sales.contract.detail.advancePaymentTitle')}</strong>
        <span>
          {t('sales.contract.detail.recordCount', {
            count: contract.advance_payments.length,
          })}
        </span>
      </div>
      <Table<ExportContractAdvancePayment>
        columns={[
          { title: t('sales.contract.field.paymentNo'), dataIndex: 'payment_no' },
          {
            title: t('sales.contract.field.receivedAt'),
            dataIndex: 'received_at',
            render: formatDate,
          },
          { title: t('sales.contract.field.payer'), dataIndex: 'payer_name' },
          {
            title: t('sales.contract.field.amount'),
            dataIndex: 'amount',
            render: (_, payment) => formatMoney(payment.amount, payment.currency),
          },
          { title: t('sales.contract.field.remark'), dataIndex: 'remark', render: nullableText },
        ]}
        dataSource={contract.advance_payments}
        locale={{ emptyText: t('sales.contract.detail.noAdvancePayments') }}
        pagination={false}
        rowKey="id"
        size="small"
      />
    </>
  )
}
