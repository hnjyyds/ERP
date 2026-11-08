import { Alert } from 'antd'

import type { RoutedDetailPageProps } from '@/app/pages/appHelpers'
import { purchaseInquiryPath } from '@/app/routes'
import { Metric } from '@/shared/ui'
import { t } from '@/app/appI18n'

import { usePurchaseInquiriesList } from './hooks/usePurchaseInquiriesList'
import { usePurchaseInquiryWorkflow } from './hooks/usePurchaseInquiryWorkflow'
import { PurchaseInquiryDetailPanel } from './views/PurchaseInquiryDetailPanel'
import { PurchaseInquiryFormModal } from './views/PurchaseInquiryFormModal'
import { PurchaseInquiryListPanel } from './views/PurchaseInquiryListPanel'

export function PurchaseInquiriesPage({ detailId, onNavigate }: RoutedDetailPageProps) {
  const list = usePurchaseInquiriesList({ detailId, onNavigate })
  const workflow = usePurchaseInquiryWorkflow({
    detailId,
    selectedInquiry: list.selectedInquiry,
    upsertInquiry: list.upsertInquiry,
    reloadInquiries: list.loadInquiries,
    reloadAuxiliary: list.loadPurchaseInquiryAuxiliary,
  })

  return (
    <section className="purchase-inquiry-page">
      <div className="summary-strip" aria-label={t('purchase.inquiry.metric.overviewAria')}>
        <Metric label={t('purchase.inquiry.metric.inquiryCount')} value={list.total} />
        <Metric label={t('purchase.inquiry.metric.sentCount')} value={list.summary.sent_count} />
        <Metric label={t('purchase.inquiry.metric.quotedCount')} value={list.summary.quoted_count} />
        <Metric
          label={t('purchase.inquiry.metric.quotationCount')}
          value={list.summary.quotation_count}
        />
      </div>

      {workflow.message ? (
        <Alert className="workspace-alert" title={workflow.message} type="success" showIcon />
      ) : null}

      <section className="business-grid purchase-inquiry-grid">
        {!detailId ? (
          <PurchaseInquiryListPanel model={list} onCreate={workflow.openCreateInquiry} />
        ) : null}

        <PurchaseInquiryFormModal workflow={workflow} />

        {detailId ? (
          <PurchaseInquiryDetailPanel
            model={list}
            workflow={workflow}
            onBack={() => onNavigate(purchaseInquiryPath)}
          />
        ) : null}
      </section>
    </section>
  )
}
