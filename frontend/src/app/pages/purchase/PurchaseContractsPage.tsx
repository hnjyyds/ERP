import { Alert } from 'antd'
import { useState } from 'react'

import type { CurrentUser } from '@/api'
import { Metric } from '@/shared/ui'
import { formatMoney, type RoutedDetailPageProps } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import { purchaseContractPath } from '@/app/routes'

import { PurchaseContractFormModal } from './components/PurchaseContractFormModal'
import { usePurchaseContractApproval } from './hooks/usePurchaseContractApproval'
import { usePurchaseContractCancel } from './hooks/usePurchaseContractCancel'
import { usePurchaseContractFormModal } from './hooks/usePurchaseContractFormModal'
import { usePurchaseContractOptions } from './hooks/usePurchaseContractOptions'
import { usePurchaseContractsList } from './hooks/usePurchaseContractsList'
import { PurchaseContractApprovalModal } from './views/PurchaseContractApprovalModal'
import { PurchaseContractCancelModal } from './views/PurchaseContractCancelModal'
import { PurchaseContractDetailPanel } from './views/PurchaseContractDetailPanel'
import { PurchaseContractListPanel } from './views/PurchaseContractListPanel'
import { PurchaseContractReissueModal } from './views/PurchaseContractReissueModal'

type Props = RoutedDetailPageProps & { currentUser: CurrentUser }

export function PurchaseContractsPage({ currentUser, detailId, onNavigate }: Props) {
  const [message, setMessage] = useState('')
  const options = usePurchaseContractOptions()
  const list = usePurchaseContractsList({ detailId, onNavigate })
  const formModal = usePurchaseContractFormModal({
    contract: list.selectedContract,
    options,
    setMessage,
    onSaved: list.applySavedContract,
  })
  const approval = usePurchaseContractApproval({
    currentUser,
    contract: list.selectedContract,
    setMessage,
    onSaved: list.applySavedContract,
  })
  const cancelActions = usePurchaseContractCancel({
    contract: list.selectedContract,
    onNavigate,
    setMessage,
    onSaved: list.applySavedContract,
  })

  const totalAmount = Number(list.summary.total_amount ?? 0)
  const openReminders = list.reminders.filter((item) => item.status === 'open').length
  const currency = list.summary.currency ?? 'USD'

  return (
    <section className="purchase-contract-page">
      <div className="summary-strip" aria-label={t('purchase.contract.metric.overviewAria')}>
        <Metric label={t('purchase.contract.metric.contractCount')} value={list.total} />
        <Metric
          label={t('purchase.contract.metric.pendingApproval')}
          value={list.summary.submitted_count}
        />
        <Metric
          label={t('purchase.contract.metric.approvedCount')}
          value={list.summary.approved_count}
        />
        <Metric
          label={t('purchase.contract.metric.contractAmount')}
          value={formatMoney(totalAmount.toFixed(2), currency)}
        />
        <Metric label={t('purchase.contract.metric.openReminders')} value={openReminders} />
      </div>

      {message ? (
        <Alert className="workspace-alert" title={message} type="success" showIcon />
      ) : null}

      <section className="business-grid purchase-contract-grid">
        {!detailId ? (
          <PurchaseContractListPanel
            model={list}
            onCreate={formModal.openCreate}
            onGenerate={formModal.openGenerate}
            onOpenDetail={list.stopAndOpenContractDetail}
          />
        ) : null}

        <PurchaseContractFormModal
          open={formModal.modalOpen}
          mode={formModal.mode}
          editingContractId={formModal.editingContractId}
          form={formModal.form}
          generateForm={formModal.generateForm}
          setForm={formModal.setForm}
          setGenerateForm={formModal.setGenerateForm}
          suppliers={options.suppliers}
          assignableUsers={options.assignableUsers}
          products={options.products}
          exportContracts={options.exportContracts}
          onSupplierSearch={options.loadSuppliers}
          loadingSuppliers={options.loadingSuppliers}
          loadingAssignableUsers={options.loadingAssignableUsers}
          loadingProducts={options.loadingProducts}
          loadingExportContracts={options.loadingExportContracts}
          submitting={formModal.submitting}
          productDrawerOpen={formModal.productDrawerOpen}
          productSearch={formModal.productSearch}
          pendingProductIds={formModal.pendingProductIds}
          selectedProductIds={formModal.selectedProductIds}
          onClose={formModal.close}
          onSubmitManual={formModal.submitContractForm}
          onSubmitGenerate={formModal.generateContractFromSources}
          applySupplier={formModal.applySupplier}
          applyBuyer={formModal.applyBuyer}
          applyBuyerToGenerateForm={formModal.applyBuyerToGenerateForm}
          applyQcUser={formModal.applyQcUser}
          applyQcUserToGenerateForm={formModal.applyQcUserToGenerateForm}
          onOpenProductDrawer={formModal.openProductDrawer}
          onCloseProductDrawer={formModal.closeProductDrawer}
          onProductSearchChange={formModal.setProductSearch}
          onTogglePendingProduct={formModal.togglePendingProduct}
          onAddPendingProducts={formModal.addPendingProducts}
          updateContractLine={formModal.updateContractLine}
          removeContractLine={formModal.removeContractLine}
        />

        {detailId ? (
          <PurchaseContractDetailPanel
            contract={list.selectedContract}
            currentUser={currentUser}
            reminders={list.reminders}
            approval={approval}
            cancelActions={cancelActions}
            onBack={() => onNavigate(purchaseContractPath)}
            onEdit={formModal.openEdit}
          />
        ) : null}
      </section>

      {detailId && list.selectedContract ? (
        <>
          <PurchaseContractApprovalModal
            contract={list.selectedContract}
            currentUser={currentUser}
            model={approval}
          />
          <PurchaseContractCancelModal model={cancelActions} />
          <PurchaseContractReissueModal model={cancelActions} />
        </>
      ) : null}
    </section>
  )
}
