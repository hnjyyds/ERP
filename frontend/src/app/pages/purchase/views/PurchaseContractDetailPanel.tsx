import { Alert, Button } from 'antd'
import { ArrowLeft, FileStack, FileSpreadsheet, LayoutDashboard } from 'lucide-react'

import type { CurrentUser, PurchaseContract, PurchaseContractReminder } from '@/api'
import { PanelTitle } from '@/shared/ui'
import { canApproveAssignedRecord, formatDate, formatMoney } from '@/app/pages/appHelpers'
import { ApprovalAssigneeSelect } from '@/app/components/ApprovalAssigneeSelect'
import { t } from '@/app/appI18n'

import {
  purchaseContractSourceTypeLabel,
  purchaseContractStatusLabel,
} from '../purchaseContractHelpers'
import type { PurchaseContractApprovalModel } from '../hooks/usePurchaseContractApproval'
import type { PurchaseContractCancelModel } from '../hooks/usePurchaseContractCancel'
import { PurchaseContractDetailTables } from './PurchaseContractDetailTables'

type Props = {
  contract: PurchaseContract | null
  currentUser: CurrentUser
  reminders: PurchaseContractReminder[]
  approval: PurchaseContractApprovalModel
  cancelActions: PurchaseContractCancelModel
  onEdit: () => void
  onBack: () => void
}

/** 采购合同详情：状态提示、汇总分区、操作按钮与明细表格。 */
export function PurchaseContractDetailPanel({
  contract,
  currentUser,
  reminders,
  approval,
  cancelActions,
  onEdit,
  onBack,
}: Props) {
  return (
    <section className="workspace-panel detail-panel product-detail-panel">
      <div className="panel-heading toolbar-heading">
        <PanelTitle
          icon={<LayoutDashboard size={18} />}
          title={t('purchase.contract.detail.title')}
        />
        {contract ? (
          <span className="panel-kicker contract-code-label">{contract.code}</span>
        ) : null}
        <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
          {t('purchase.contract.action.backToList')}
        </Button>
      </div>
      {contract ? (
        <>
          {contract.approval_status === 'cancelled' ? (
            <Alert
              description={contract.cancel_reason ?? t('purchase.contract.detail.notFilled')}
              showIcon
              title={t('purchase.contract.detail.cancelledBanner', {
                date: contract.cancelled_at
                  ? formatDate(contract.cancelled_at)
                  : t('purchase.contract.detail.notFilled'),
                name: contract.cancelled_by_name ?? t('purchase.contract.detail.notFilled'),
              })}
              type="warning"
            />
          ) : null}
          {contract.reissued_from_code ? (
            <Alert
              description={contract.reissue_reason ?? t('purchase.contract.detail.notFilled')}
              showIcon
              title={t('purchase.contract.detail.reissuedFromBanner', {
                code: contract.reissued_from_code,
              })}
              type="info"
            />
          ) : null}
          <div className="contract-summary-intro">
            <strong>{t('purchase.contract.detail.summaryTitle')}</strong>
            <span>{t('purchase.contract.detail.summaryDescription')}</span>
          </div>

          <div className="contract-summary-sections">
            <section className="contract-summary-section">
              <div className="contract-summary-section-heading">
                <div>
                  <h3>{t('purchase.contract.detail.overviewTitle')}</h3>
                  <p>{t('purchase.contract.detail.overviewDescription')}</p>
                </div>
              </div>
              <dl className="contract-summary-grid">
                <div>
                  <dt>{t('purchase.contract.field.contractStatus')}</dt>
                  <dd>
                    <span
                      className="contract-status-chip"
                      data-status={contract.approval_status}
                    >
                      {purchaseContractStatusLabel(contract.approval_status)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>{t('purchase.contract.field.contractDate')}</dt>
                  <dd>{formatDate(contract.contract_date)}</dd>
                </div>
                <div>
                  <dt>{t('purchase.contract.field.contractSource')}</dt>
                  <dd>{purchaseContractSourceTypeLabel(contract.source_type)}</dd>
                </div>
                <div>
                  <dt>{t('purchase.contract.field.supplier')}</dt>
                  <dd>{contract.supplier_name}</dd>
                </div>
              </dl>
            </section>

            <section className="contract-summary-section">
              <div className="contract-summary-section-heading">
                <div>
                  <h3>{t('purchase.contract.detail.fulfillmentTitle')}</h3>
                  <p>{t('purchase.contract.detail.fulfillmentDescription')}</p>
                </div>
              </div>
              <dl className="contract-summary-grid">
                <div>
                  <dt>{t('purchase.contract.field.buyerOwner')}</dt>
                  <dd>{contract.buyer_user_name ?? t('common.notSet')}</dd>
                </div>
                <div>
                  <dt>{t('purchase.contract.field.qcUser')}</dt>
                  <dd>{contract.qc_user_name ?? t('common.notSet')}</dd>
                </div>
                <div>
                  <dt>{t('purchase.contract.field.expectedDeliveryDate')}</dt>
                  <dd>{formatDate(contract.delivery_date)}</dd>
                </div>
              </dl>
            </section>

            <section className="contract-summary-section">
              <div className="contract-summary-section-heading">
                <div>
                  <h3>{t('purchase.contract.detail.amountApprovalTitle')}</h3>
                  <p>{t('purchase.contract.detail.amountApprovalDescription')}</p>
                </div>
              </div>
              <dl className="contract-summary-grid">
                <div>
                  <dt>{t('purchase.contract.field.contractAmount')}</dt>
                  <dd>
                    {formatMoney(contract.statistics.total_amount, contract.currency)}
                  </dd>
                </div>
                <div>
                  <dt>{t('purchase.contract.field.unpaidAmount')}</dt>
                  <dd>{formatMoney(contract.statistics.unpaid_amount, contract.currency)}</dd>
                </div>
                <div>
                  <dt>{t('purchase.contract.field.approver')}</dt>
                  <dd>
                    {contract.reviewer_name ?? t('purchase.contract.detail.notApproved')}
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          <div className="transaction-box">
            <strong>{t('purchase.contract.field.paymentTerms')}</strong>
            <p>{contract.payment_terms || t('common.notSet')}</p>
          </div>
          <div className="transaction-box">
            <strong>{t('purchase.contract.field.remarks')}</strong>
            <p>{contract.remarks ?? t('purchase.contract.detail.remarksEmpty')}</p>
          </div>

          {contract.approval_status === 'rejected' ? (
            <Alert
              className="purchase-contract-rejection-alert"
              description={
                contract.rejection_reason ?? t('purchase.contract.detail.rejectionReasonEmpty')
              }
              showIcon
              title={t('purchase.contract.detail.rejectedTitle', {
                date: formatDate(contract.rejected_at),
              })}
              type="error"
            />
          ) : null}

          <div className="delivery-action-row">
            <Button
              disabled={!['draft', 'rejected'].includes(contract.approval_status)}
              onClick={onEdit}
            >
              {t('purchase.contract.action.editContract')}
            </Button>
            {contract.approval_status === 'draft' ? (
              <ApprovalAssigneeSelect
                currentUserId={currentUser.id}
                onChange={approval.setReviewerId}
                requiredPermission="purchase:contract:approve"
                value={approval.reviewerId}
              />
            ) : null}
            <Button
              disabled={contract.approval_status !== 'draft' || !approval.reviewerId}
              loading={approval.submitting}
              onClick={() => void approval.submitSelectedContract()}
            >
              {t('purchase.contract.action.submitContract')}
            </Button>
            <Button
              disabled={
                contract.approval_status !== 'submitted' ||
                !canApproveAssignedRecord(
                  currentUser,
                  contract.reviewer_id,
                  'purchase:contract:approve',
                )
              }
              onClick={approval.openApprovalModal}
            >
              {t('purchase.contract.action.approveContract')}
            </Button>
            <Button
              icon={<FileSpreadsheet size={16} />}
              loading={approval.submitting}
              onClick={() => void approval.generateSelectedContractTemplate()}
            >
              {t('purchase.contract.action.generateTemplate')}
            </Button>
            {['draft', 'approved', 'rejected'].includes(contract.approval_status) ? (
              <Button danger onClick={cancelActions.openCancelModal}>
                {t('purchase.contract.action.cancel')}
              </Button>
            ) : null}
            {contract.approval_status === 'cancelled' ? (
              <Button type="primary" onClick={cancelActions.openReissueModal}>
                {t('purchase.contract.action.reissue')}
              </Button>
            ) : null}
          </div>
          {contract.approval_status === 'submitted' &&
          !canApproveAssignedRecord(
            currentUser,
            contract.reviewer_id,
            'purchase:contract:approve',
          ) ? (
            <Alert
              message={t('purchase.contract.action.waitingApproval', {
                name: contract.reviewer_name ?? t('purchase.contract.action.defaultReviewer'),
              })}
              showIcon
              type="info"
            />
          ) : null}

          <div className="accessory-heading">
            <strong>{t('purchase.contract.detail.linesTitle')}</strong>
            <span>
              {t('purchase.contract.detail.lineCount', { count: contract.lines.length })}
            </span>
          </div>
          <table className="data-table compact-table">
            <thead>
              <tr>
                <th>{t('purchase.contract.field.product')}</th>
                <th>{t('purchase.contract.field.specificationModel')}</th>
                <th>{t('purchase.contract.field.quantity')}</th>
                <th>{t('purchase.contract.field.unitPrice')}</th>
                <th>{t('purchase.contract.field.amount')}</th>
                <th>{t('purchase.contract.field.unreceived')}</th>
              </tr>
            </thead>
            <tbody>
              {contract.lines.map((line) => (
                <tr key={line.id}>
                  <td>
                    {line.product_code ?? t('purchase.contract.detail.notFilled')} /{' '}
                    {line.product_name}
                  </td>
                  <td>
                    {line.specification ?? t('purchase.contract.detail.notFilled')} /{' '}
                    {line.model ?? t('purchase.contract.detail.notFilled')}
                  </td>
                  <td>
                    {line.quantity} {line.unit}
                  </td>
                  <td>{formatMoney(line.unit_price, contract.currency)}</td>
                  <td>{formatMoney(line.amount, contract.currency)}</td>
                  <td>
                    {line.unreceived_quantity} {line.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <PurchaseContractDetailTables contract={contract} reminders={reminders} />
        </>
      ) : (
        <div className="module-state panel-empty-state">
          <FileStack size={28} />
          <strong>{t('purchase.contract.detail.emptyTitle')}</strong>
          <span>{t('purchase.contract.detail.emptyDescription')}</span>
        </div>
      )}
    </section>
  )
}
