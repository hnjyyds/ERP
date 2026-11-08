import { Alert } from 'antd'

import type { CurrentUser } from '@/api'
import { Metric } from '@/shared/ui'
import { formatMoney, type RoutedDetailPageProps } from '@/app/pages/appHelpers'
import { exportQuotationPath } from '@/app/routes'
import { t } from '@/app/appI18n'

import { useExportQuotationWorkflow } from './hooks/useExportQuotationWorkflow'
import { useExportQuotationsList } from './hooks/useExportQuotationsList'
import { ExportQuotationDetailPanel } from './views/ExportQuotationDetailPanel'
import { ExportQuotationFormModal } from './views/ExportQuotationFormModal'
import { ExportQuotationListPanel } from './views/ExportQuotationListPanel'

type Props = RoutedDetailPageProps & { currentUser: CurrentUser }

export function ExportQuotationsPage({ currentUser, detailId, onNavigate }: Props) {
  const list = useExportQuotationsList({ detailId, onNavigate })
  const workflow = useExportQuotationWorkflow({
    currentUser,
    selectedQuotation: list.selectedQuotation,
    customers: list.customers,
    onNavigate,
    setSelectedQuotationId: list.setSelectedQuotationId,
    applyCreatedQuotation: list.applyCreatedQuotation,
    applySavedQuotation: list.applySavedQuotation,
    applySubmittedQuotation: list.applySubmittedQuotation,
    applyApprovedQuotation: list.applyApprovedQuotation,
    reloadQuotations: (id) => list.loadQuotations(id),
  })

  return (
    <section className="export-quotation-page">
      <div className="summary-strip" aria-label={t('sales.quotation.metric.overviewAria')}>
        <Metric label={t('sales.quotation.metric.quotationCount')} value={list.total} />
        <Metric
          label={t('sales.quotation.metric.pendingApproval')}
          value={list.summary.submitted_count}
          intent={list.summary.submitted_count > 0 ? 'warning' : 'normal'}
        />
        <Metric label={t('sales.quotation.metric.approvedCount')} value={list.summary.approved_count} />
        <Metric
          label={t('sales.quotation.metric.quotationAmount')}
          value={formatMoney(list.summary.total_amount, list.summary.currency)}
        />
      </div>

      {workflow.message ? (
        <Alert className="workspace-alert" title={workflow.message} type="success" showIcon />
      ) : null}

      <section className="business-grid export-quotation-grid">
        {!detailId ? (
          <ExportQuotationListPanel model={list} onOpenForm={workflow.openNewQuotationForm} />
        ) : null}

        <ExportQuotationFormModal
          workflow={workflow}
          customers={list.customers}
          loadingCustomers={list.loadingCustomers}
          selectedQuotation={list.selectedQuotation}
        />

        {detailId ? (
          <ExportQuotationDetailPanel
            quotation={list.selectedQuotation}
            history={list.history}
            purchaseReferences={list.purchaseReferences}
            sampleDeliveries={list.sampleDeliveries}
            workflow={workflow}
            currentUser={currentUser}
            onBack={() => onNavigate(exportQuotationPath)}
          />
        ) : null}
      </section>
    </section>
  )
}
