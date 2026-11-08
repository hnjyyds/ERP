import { Alert } from 'antd'
import { useState } from 'react'

import type { CurrentUser } from '@/api'
import { Metric } from '@/shared/ui'
import { formatMoney, type RoutedDetailPageProps } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import { exportContractPath } from '@/app/routes'

import { ExportContractFormModal } from './components/ExportContractFormModal'
import { useExportContractApproval } from './hooks/useExportContractApproval'
import { useExportContractCancel } from './hooks/useExportContractCancel'
import { useExportContractExport } from './hooks/useExportContractExport'
import { useExportContractFormModal } from './hooks/useExportContractFormModal'
import { useExportContractHistory } from './hooks/useExportContractHistory'
import { useExportContractOptions } from './hooks/useExportContractOptions'
import { useExportContractSigning } from './hooks/useExportContractSigning'
import { useExportContractsList } from './hooks/useExportContractsList'
import { ExportContractCancelModal } from './views/ExportContractCancelModal'
import { ExportContractDetailPanel } from './views/ExportContractDetailPanel'
import { ExportContractListPanel } from './views/ExportContractListPanel'
import { ExportContractProductDrawer } from './views/ExportContractProductDrawer'
import { ExportContractReissueModal } from './views/ExportContractReissueModal'

type Props = RoutedDetailPageProps & { currentUser: CurrentUser }

export function ExportContractsPage({ currentUser, detailId, onNavigate }: Props) {
  const [message, setMessage] = useState('')
  const list = useExportContractsList({ detailId, onNavigate })
  const options = useExportContractOptions()
  const exportActions = useExportContractExport({
    contract: list.selectedContract,
    setMessage,
  })
  const formModal = useExportContractFormModal({
    currentUser,
    options,
    setMessage,
    onSaved: list.applySavedContract,
    clearExportPreview: exportActions.clearExportPreview,
  })
  const approval = useExportContractApproval({
    currentUser,
    detailId,
    contract: list.selectedContract,
    setMessage,
    onSaved: list.applySavedContract,
  })
  const signing = useExportContractSigning({
    detailId,
    contract: list.selectedContract,
    setMessage,
    onSaved: list.applySavedContract,
  })
  const { history } = useExportContractHistory({
    detailId,
    contract: list.selectedContract,
  })
  const cancelActions = useExportContractCancel({
    contract: list.selectedContract,
    onNavigate,
    setMessage,
    onSaved: list.applySavedContract,
  })

  const totalAmount = Number(list.summary.total_amount)
  const totalAdvance = Number(list.summary.advance_payment_amount)
  const currency = list.summary.currency ?? 'USD'

  return (
    <section className="export-contract-page">
      <div className="summary-strip" aria-label={t('sales.contract.metric.overviewAria')}>
        <Metric label={t('sales.contract.metric.contractCount')} value={list.total} />
        <Metric
          label={t('sales.contract.metric.pendingApproval')}
          value={list.summary.submitted_count}
        />
        <Metric
          label={t('sales.contract.metric.approvedCount')}
          value={list.summary.approved_count}
        />
        <Metric
          label={t('sales.contract.metric.contractAmount')}
          value={formatMoney(totalAmount.toFixed(2), currency)}
        />
        <Metric
          label={t('sales.contract.metric.advancePayment')}
          value={formatMoney(totalAdvance.toFixed(2), currency)}
        />
      </div>

      {message ? (
        <Alert className="workspace-alert" title={message} type="success" showIcon />
      ) : null}

      <section className="business-grid export-contract-grid">
        {!detailId ? (
          <ExportContractListPanel
            model={list}
            customers={options.customers}
            loadingCustomers={options.loadingCustomers}
            onCreate={formModal.openCreateContractModal}
            onOpenDetail={list.stopAndOpenContractDetail}
          />
        ) : null}

        <ExportContractFormModal
          open={formModal.modalOpen}
          editingContractId={formModal.editingContractId}
          form={formModal.form}
          setForm={formModal.setForm}
          customers={options.customers}
          assignableUsers={options.assignableUsers}
          loadingCustomers={options.loadingCustomers}
          loadingAssignableUsers={options.loadingAssignableUsers}
          loadingProducts={options.loadingProducts}
          submitting={formModal.submitting}
          onClose={formModal.closeCreateContractModal}
          onSubmit={formModal.submitContract}
          applyCustomerToContractForm={formModal.applyCustomerToContractForm}
          applySalesUserToContractForm={formModal.applySalesUserToContractForm}
          removeContractLine={formModal.removeContractLine}
          updateContractLine={formModal.updateContractLine}
          openProductDrawer={formModal.openProductDrawer}
        />

        <ExportContractProductDrawer model={formModal} />

        {detailId ? (
          <ExportContractDetailPanel
            contract={list.selectedContract}
            currentUser={currentUser}
            history={history}
            approval={approval}
            signing={signing}
            exportActions={exportActions}
            cancelActions={cancelActions}
            onBack={() => onNavigate(exportContractPath)}
            onLoadForEdit={() => {
              if (list.selectedContract) formModal.loadContractIntoForm(list.selectedContract)
            }}
          />
        ) : null}

        <ExportContractCancelModal model={cancelActions} />
        <ExportContractReissueModal model={cancelActions} />
      </section>
    </section>
  )
}
