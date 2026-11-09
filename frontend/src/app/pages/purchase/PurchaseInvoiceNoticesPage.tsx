import { Alert } from 'antd'

import { t } from '@/app/appI18n'
import { formatMoney, type RoutedDetailPageProps } from '@/app/pages/appHelpers'
import { purchaseInvoiceNoticePath } from '@/app/routes'
import { Metric } from '@/shared/ui'

import { usePurchaseInvoiceNotices } from './invoiceNotices/hooks/usePurchaseInvoiceNotices'
import { PurchaseInvoiceNoticesListView } from './invoiceNotices/views/PurchaseInvoiceNoticesListView'
import { PurchaseInvoiceNoticeDetailView } from './invoiceNotices/views/PurchaseInvoiceNoticeDetailView'
import { PurchaseInvoiceGenerateModal } from './invoiceNotices/forms/PurchaseInvoiceGenerateModal'

export function PurchaseInvoiceNoticesPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const model = usePurchaseInvoiceNotices({ detailId, onNavigate })
  const { summary, reminders, total, message } = model
  const sentCount = summary.sent_count
  const receivedCount = summary.received_count
  const openReminders = reminders.filter((item) => item.status === 'open').length
  const totalAmount = Number(summary.total_amount ?? 0)
  const currency = summary.currency ?? 'CNY'

  return (
    <section className="purchase-invoice-page">
      <div className="summary-strip" aria-label={t('purchase.invoiceNotice.metric.overviewAria')}>
        <Metric label={t('purchase.invoiceNotice.metric.noticeCount')} value={total} />
        <Metric label={t('purchase.invoiceNotice.metric.sentCount')} value={sentCount} />
        <Metric label={t('purchase.invoiceNotice.metric.receivedCount')} value={receivedCount} />
        <Metric
          label={t('purchase.invoiceNotice.metric.noticeAmount')}
          value={formatMoney(totalAmount.toFixed(2), currency)}
        />
        <Metric label={t('purchase.invoiceNotice.metric.openReminders')} value={openReminders} />
      </div>

      {message ? <Alert className="workspace-alert" title={message} type="success" showIcon /> : null}

      <section className="business-grid purchase-invoice-grid">
        {!detailId ? <PurchaseInvoiceNoticesListView model={model} /> : null}

        <PurchaseInvoiceGenerateModal model={model} />

        {detailId ? (
          <PurchaseInvoiceNoticeDetailView
            model={model}
            onBack={() => onNavigate(purchaseInvoiceNoticePath)}
          />
        ) : null}
      </section>
    </section>
  )
}
