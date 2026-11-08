import type { PurchaseContract, PurchaseContractReminder } from '@/api'
import { formatDate, formatMoney } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'

import { purchaseReminderStatusLabel, purchaseReminderTypeLabel } from '../purchaseContractHelpers'

type Props = {
  contract: PurchaseContract
  reminders: PurchaseContractReminder[]
}

/** 采购合同详情下方的关联合同、提醒、收发与收付款表格。 */
export function PurchaseContractDetailTables({ contract, reminders }: Props) {
  return (
    <>
      <div className="accessory-heading">
        <strong>{t('purchase.contract.detail.sourceContractsTitle')}</strong>
        <span>
          {t('purchase.contract.detail.sourceCount', {
            count: contract.source_links.length,
          })}
        </span>
      </div>
      <table className="data-table compact-table">
        <thead>
          <tr>
            <th>{t('purchase.contract.field.exportContract')}</th>
            <th>{t('purchase.contract.field.customer')}</th>
            <th>{t('purchase.contract.field.product')}</th>
            <th>{t('purchase.contract.field.demandQuantity')}</th>
          </tr>
        </thead>
        <tbody>
          {contract.source_links.map((source) => (
            <tr key={source.id}>
              <td>{source.export_contract_no}</td>
              <td>{source.customer_name}</td>
              <td>{source.product_code ?? t('purchase.contract.detail.notFilled')}</td>
              <td>
                {source.demand_quantity} {source.unit}
              </td>
            </tr>
          ))}
          {contract.source_links.length === 0 ? (
            <tr>
              <td className="empty-cell" colSpan={4}>
                {t('purchase.contract.detail.noSourceLinks')}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className="accessory-heading">
        <strong>{t('purchase.contract.detail.remindersTitle')}</strong>
        <span>
          {t('purchase.contract.detail.reminderCount', {
            count: contract.reminders.length,
          })}
        </span>
      </div>
      <table className="data-table compact-table">
        <thead>
          <tr>
            <th>{t('purchase.contract.field.reminderType')}</th>
            <th>{t('purchase.contract.field.reminderTitle')}</th>
            <th>{t('purchase.contract.field.dueDate')}</th>
            <th>{t('purchase.contract.field.amount')}</th>
            <th>{t('purchase.contract.field.reminderStatus')}</th>
          </tr>
        </thead>
        <tbody>
          {contract.reminders.map((reminder) => (
            <tr key={reminder.id}>
              <td>{purchaseReminderTypeLabel(reminder.reminder_type)}</td>
              <td>{reminder.title}</td>
              <td>{formatDate(reminder.due_date)}</td>
              <td>
                {reminder.amount
                  ? formatMoney(reminder.amount, reminder.currency)
                  : t('purchase.contract.detail.noAmount')}
              </td>
              <td>{purchaseReminderStatusLabel(reminder.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="accessory-heading">
        <strong>{t('purchase.contract.detail.progressTitle')}</strong>
        <span>
          {t('purchase.contract.detail.unreceivedCount', {
            count: contract.statistics.unreceived_quantity,
          })}
        </span>
      </div>
      <table className="data-table compact-table">
        <thead>
          <tr>
            <th>{t('purchase.contract.field.totalQuantity')}</th>
            <th>{t('purchase.contract.field.received')}</th>
            <th>{t('purchase.contract.field.unreceived')}</th>
            <th>{t('purchase.contract.field.paid')}</th>
            <th>{t('purchase.contract.field.unpaid')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{contract.statistics.total_quantity}</td>
            <td>{contract.statistics.received_quantity}</td>
            <td>{contract.statistics.unreceived_quantity}</td>
            <td>{formatMoney(contract.statistics.paid_amount, contract.currency)}</td>
            <td>{formatMoney(contract.statistics.unpaid_amount, contract.currency)}</td>
          </tr>
        </tbody>
      </table>

      <div className="accessory-heading">
        <strong>{t('purchase.contract.detail.globalRemindersTitle')}</strong>
        <span>
          {t('purchase.contract.detail.reminderCount', { count: reminders.length })}
        </span>
      </div>
      <table className="data-table compact-table">
        <thead>
          <tr>
            <th>{t('purchase.contract.field.reminderType')}</th>
            <th>{t('purchase.contract.field.reminderTitle')}</th>
            <th>{t('purchase.contract.field.dueDate')}</th>
            <th>{t('purchase.contract.field.amount')}</th>
          </tr>
        </thead>
        <tbody>
          {reminders.map((reminder) => (
            <tr key={reminder.id}>
              <td>{purchaseReminderTypeLabel(reminder.reminder_type)}</td>
              <td>{reminder.title}</td>
              <td>{formatDate(reminder.due_date)}</td>
              <td>
                {reminder.amount
                  ? formatMoney(reminder.amount, reminder.currency)
                  : t('purchase.contract.detail.noAmount')}
              </td>
            </tr>
          ))}
          {reminders.length === 0 ? (
            <tr>
              <td className="empty-cell" colSpan={4}>
                {t('purchase.contract.detail.noReminders')}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </>
  )
}
