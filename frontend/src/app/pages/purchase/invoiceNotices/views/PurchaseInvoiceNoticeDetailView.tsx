// 开票通知：详情面板（状态、行项目、提醒与发送/收票弹窗）

import { Button, Input, Modal } from 'antd'
import { ArrowLeft, LayoutDashboard, Receipt } from 'lucide-react'

import { t } from '@/app/appI18n'
import { formatDate, formatMoney } from '@/app/pages/appHelpers'
import { PanelTitle } from '@/shared/ui'
import {
  purchaseInvoiceNoticeStatusLabel,
  purchaseInvoiceReminderStatusLabel,
} from '../invoiceNoticeHelpers'
import type { PurchaseInvoiceNoticesModel } from '../hooks/usePurchaseInvoiceNotices'

type Props = {
  model: PurchaseInvoiceNoticesModel
  onBack: () => void
}

export function PurchaseInvoiceNoticeDetailView({ model, onBack }: Props) {
  const {
    selectedNotice,
    reminders,
    submitting,
    sendForm,
    setSendForm,
    receiveForm,
    setReceiveForm,
    invoiceActionModal,
    setInvoiceActionModal,
    sendSelectedNotice,
    receiveSelectedNotice,
  } = model

  return (
    <section className="workspace-panel detail-panel product-detail-panel">
      <div className="panel-heading toolbar-heading">
        <PanelTitle
          icon={<LayoutDashboard size={18} />}
          title={t('purchase.invoiceNotice.detail.title')}
        />
        <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
          {t('purchase.invoiceNotice.action.backToList')}
        </Button>
      </div>
      {selectedNotice ? (
        <>
          <dl className="detail-list">
            <div>
              <dt>{t('purchase.invoiceNotice.field.statusNoticeDate')}</dt>
              <dd>
                {purchaseInvoiceNoticeStatusLabel(selectedNotice.status)} /{' '}
                {formatDate(selectedNotice.notice_date)}
              </dd>
            </div>
            <div>
              <dt>{t('purchase.invoiceNotice.field.supplier')}</dt>
              <dd>{selectedNotice.supplier_name}</dd>
            </div>
            <div>
              <dt>{t('purchase.invoiceNotice.field.customsDeclarationNo')}</dt>
              <dd>{selectedNotice.customs_declaration_no}</dd>
            </div>
            <div>
              <dt>{t('purchase.invoiceNotice.field.declarationDate')}</dt>
              <dd>{formatDate(selectedNotice.declaration_date)}</dd>
            </div>
            <div>
              <dt>{t('purchase.invoiceNotice.field.invoiceQuantity')}</dt>
              <dd>{selectedNotice.total_quantity}</dd>
            </div>
            <div>
              <dt>{t('purchase.invoiceNotice.field.noticeAmount')}</dt>
              <dd>{formatMoney(selectedNotice.total_amount, selectedNotice.currency)}</dd>
            </div>
            <div>
              <dt>{t('purchase.invoiceNotice.field.sender')}</dt>
              <dd>{selectedNotice.sender_name ?? t('purchase.invoiceNotice.detail.notSent')}</dd>
            </div>
            <div>
              <dt>{t('purchase.invoiceNotice.field.taxInvoiceNo')}</dt>
              <dd>
                {selectedNotice.tax_invoice_no ?? t('purchase.invoiceNotice.detail.notReceived')}
              </dd>
            </div>
          </dl>

          <div className="transaction-box">
            <strong>{t('purchase.invoiceNotice.detail.remarksTitle')}</strong>
            <p>{selectedNotice.remarks ?? t('purchase.invoiceNotice.detail.remarksEmpty')}</p>
          </div>

          <div className="delivery-action-row">
            <Button
              disabled={selectedNotice.status !== 'draft'}
              type="primary"
              onClick={() => setInvoiceActionModal('send')}
            >
              {t('purchase.invoiceNotice.action.sendNotice')}
            </Button>
            <Button
              disabled={selectedNotice.status === 'received'}
              onClick={() => setInvoiceActionModal('receive')}
            >
              {t('purchase.invoiceNotice.action.receiveInvoice')}
            </Button>
          </div>

          <Modal
            centered
            footer={null}
            open={invoiceActionModal === 'send'}
            title={t('purchase.invoiceNotice.form.sendTitle')}
            width={720}
            onCancel={() => setInvoiceActionModal(null)}
          >
            <div className="workflow-modal-content entity-modal-form">
              <form
                className="record-form accessory-form generation-form"
                onSubmit={sendSelectedNotice}
              >
                <div className="form-divider">{t('purchase.invoiceNotice.form.sendTitle')}</div>
                <div className="form-pair two">
                  <label htmlFor="purchase-invoice-sender">
                    {t('purchase.invoiceNotice.field.sender')}
                    <Input
                      id="purchase-invoice-sender"
                      required
                      value={sendForm.sender_name}
                      onChange={(event) =>
                        setSendForm({ ...sendForm, sender_name: event.target.value })
                      }
                    />
                  </label>
                  <label htmlFor="purchase-invoice-sent-at">
                    {t('purchase.invoiceNotice.field.sentAt')}
                    <Input
                      id="purchase-invoice-sent-at"
                      required
                      type="date"
                      value={sendForm.sent_at}
                      onChange={(event) =>
                        setSendForm({ ...sendForm, sent_at: event.target.value })
                      }
                    />
                  </label>
                </div>
                <Button
                  disabled={selectedNotice.status !== 'draft'}
                  htmlType="submit"
                  loading={submitting}
                  type="primary"
                >
                  {t('purchase.invoiceNotice.action.sendNotice')}
                </Button>
              </form>
            </div>
          </Modal>

          <Modal
            centered
            footer={null}
            open={invoiceActionModal === 'receive'}
            title={t('purchase.invoiceNotice.form.receiveTitle')}
            width={720}
            onCancel={() => setInvoiceActionModal(null)}
          >
            <div className="workflow-modal-content entity-modal-form">
              <form
                className="record-form accessory-form generation-form"
                onSubmit={receiveSelectedNotice}
              >
                <div className="form-divider">{t('purchase.invoiceNotice.form.receiveTitle')}</div>
                <div className="form-pair two">
                  <label htmlFor="purchase-invoice-tax-no">
                    {t('purchase.invoiceNotice.field.taxInvoiceNo')}
                    <Input
                      id="purchase-invoice-tax-no"
                      required
                      value={receiveForm.tax_invoice_no}
                      onChange={(event) =>
                        setReceiveForm({ ...receiveForm, tax_invoice_no: event.target.value })
                      }
                    />
                  </label>
                  <label htmlFor="purchase-invoice-received-at">
                    {t('purchase.invoiceNotice.field.receivedAt')}
                    <Input
                      id="purchase-invoice-received-at"
                      required
                      type="date"
                      value={receiveForm.received_at}
                      onChange={(event) =>
                        setReceiveForm({ ...receiveForm, received_at: event.target.value })
                      }
                    />
                  </label>
                </div>
                <Button
                  disabled={selectedNotice.status === 'received'}
                  htmlType="submit"
                  loading={submitting}
                >
                  {t('purchase.invoiceNotice.action.receiveInvoice')}
                </Button>
              </form>
            </div>
          </Modal>

          <div className="accessory-heading">
            <strong>{t('purchase.invoiceNotice.detail.linesTitle')}</strong>
            <span>
              {t('purchase.invoiceNotice.detail.lineCount', {
                count: selectedNotice.lines.length,
              })}
            </span>
          </div>
          <table className="data-table compact-table">
            <thead>
              <tr>
                <th>{t('purchase.invoiceNotice.field.purchaseContract')}</th>
                <th>{t('purchase.invoiceNotice.field.customsName')}</th>
                <th>{t('purchase.invoiceNotice.field.invoiceName')}</th>
                <th>{t('purchase.invoiceNotice.field.quantity')}</th>
                <th>{t('purchase.invoiceNotice.field.amount')}</th>
              </tr>
            </thead>
            <tbody>
              {selectedNotice.lines.map((line) => (
                <tr key={line.id}>
                  <td>
                    {line.purchase_contract_no ?? t('purchase.invoiceNotice.detail.notLinked')}
                  </td>
                  <td>{line.customs_name}</td>
                  <td>{line.invoice_name}</td>
                  <td>
                    {line.quantity} {line.unit}
                  </td>
                  <td>{formatMoney(line.amount, line.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="accessory-heading">
            <strong>{t('purchase.invoiceNotice.detail.remindersTitle')}</strong>
            <span>
              {t('purchase.invoiceNotice.detail.reminderCount', {
                count: selectedNotice.reminders.length,
              })}
            </span>
          </div>
          <table className="data-table compact-table">
            <thead>
              <tr>
                <th>{t('purchase.invoiceNotice.field.title')}</th>
                <th>{t('purchase.invoiceNotice.field.dueDate')}</th>
                <th>{t('purchase.invoiceNotice.field.status')}</th>
              </tr>
            </thead>
            <tbody>
              {selectedNotice.reminders.map((reminder) => (
                <tr key={reminder.id}>
                  <td>{reminder.title}</td>
                  <td>{formatDate(reminder.due_date)}</td>
                  <td>{purchaseInvoiceReminderStatusLabel(reminder.status)}</td>
                </tr>
              ))}
              {selectedNotice.reminders.length === 0 ? (
                <tr>
                  <td className="empty-cell" colSpan={3}>
                    {t('purchase.invoiceNotice.detail.remindersEmpty')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>

          <div className="accessory-heading">
            <strong>{t('purchase.invoiceNotice.detail.globalRemindersTitle')}</strong>
            <span>
              {t('purchase.invoiceNotice.detail.reminderCount', { count: reminders.length })}
            </span>
          </div>
          <table className="data-table compact-table">
            <thead>
              <tr>
                <th>{t('purchase.invoiceNotice.field.title')}</th>
                <th>{t('purchase.invoiceNotice.field.dueDate')}</th>
                <th>{t('purchase.invoiceNotice.field.status')}</th>
              </tr>
            </thead>
            <tbody>
              {reminders.map((reminder) => (
                <tr key={reminder.id}>
                  <td>{reminder.title}</td>
                  <td>{formatDate(reminder.due_date)}</td>
                  <td>{purchaseInvoiceReminderStatusLabel(reminder.status)}</td>
                </tr>
              ))}
              {reminders.length === 0 ? (
                <tr>
                  <td className="empty-cell" colSpan={3}>
                    {t('purchase.invoiceNotice.detail.noReminders')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </>
      ) : (
        <div className="module-state panel-empty-state">
          <Receipt size={28} />
          <strong>{t('purchase.invoiceNotice.detail.emptyTitle')}</strong>
          <span>{t('purchase.invoiceNotice.detail.emptyDescription')}</span>
        </div>
      )}
    </section>
  )
}
