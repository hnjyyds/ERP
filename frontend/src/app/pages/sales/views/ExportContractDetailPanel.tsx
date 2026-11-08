import { Alert, Button, Input, Table } from 'antd'
import { ArrowLeft, FileStack, LayoutDashboard } from 'lucide-react'

import type {
  CurrentUser,
  ExportContract,
  ExportContractLine,
  ExportQuotation,
} from '@/api'
import { PanelTitle } from '@/shared/ui'
import { openExportContractPrint } from '@/shared/print'
import {
  canApproveAssignedRecord,
  formatDate,
  formatMoney,
  nullableText,
} from '@/app/pages/appHelpers'
import { ApprovalAssigneeSelect } from '@/app/components/ApprovalAssigneeSelect'
import { t } from '@/app/appI18n'

import { exportContractStatusLabel, signatureStatusLabel } from '../exportContractHelpers'
import type { ExportContractApprovalModel } from '../hooks/useExportContractApproval'
import type { ExportContractCancelModel } from '../hooks/useExportContractCancel'
import type { ExportContractExportModel } from '../hooks/useExportContractExport'
import type { ExportContractSigningModel } from '../hooks/useExportContractSigning'
import { ExportContractDetailTables } from './ExportContractDetailTables'

type Props = {
  contract: ExportContract | null
  currentUser: CurrentUser
  history: ExportQuotation[]
  approval: ExportContractApprovalModel
  signing: ExportContractSigningModel
  exportActions: ExportContractExportModel
  cancelActions: ExportContractCancelModel
  onLoadForEdit: () => void
  onBack: () => void
}

/** 出口合同详情：汇总、操作按钮、签署/预收款表单与明细表格。 */
export function ExportContractDetailPanel({
  contract,
  currentUser,
  history,
  approval,
  signing,
  exportActions,
  cancelActions,
  onLoadForEdit,
  onBack,
}: Props) {
  return (
    <section className="workspace-panel detail-panel product-detail-panel">
      <div className="panel-heading toolbar-heading">
        <PanelTitle
          icon={<LayoutDashboard size={18} />}
          title={t('sales.contract.detail.title')}
        />
        <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
          {t('sales.contract.action.backToList')}
        </Button>
      </div>
      {contract ? (
        <>
          {contract.approval_status === 'cancelled' ? (
            <Alert
              showIcon
              description={contract.cancel_reason ?? t('sales.contract.detail.notFilled')}
              message={t('sales.contract.detail.cancelledBanner', {
                date: contract.cancelled_at
                  ? formatDate(contract.cancelled_at)
                  : t('sales.contract.detail.notFilled'),
                name: contract.cancelled_by_name ?? t('sales.contract.detail.notFilled'),
              })}
              type="warning"
            />
          ) : null}
          {contract.reissued_from_code ? (
            <Alert
              showIcon
              description={contract.reissue_reason ?? t('sales.contract.detail.notFilled')}
              message={t('sales.contract.detail.reissuedFromBanner', {
                code: contract.reissued_from_code,
              })}
              type="info"
            />
          ) : null}

          <dl className="detail-list">
            <div>
              <dt>{t('sales.contract.detail.statusSignature')}</dt>
              <dd>
                {exportContractStatusLabel(contract.approval_status)} /{' '}
                {signatureStatusLabel(contract.signature_status)}
              </dd>
            </div>
            <div>
              <dt>{t('sales.contract.field.customer')}</dt>
              <dd>{contract.customer_name}</dd>
            </div>
            <div>
              <dt>{t('sales.contract.field.salesperson')}</dt>
              <dd>{contract.sales_user_name ?? t('sales.contract.detail.notFilled')}</dd>
            </div>
            <div>
              <dt>{t('sales.contract.field.tradeTerm')}</dt>
              <dd>{contract.trade_term}</dd>
            </div>
            <div>
              <dt>{t('sales.contract.field.paymentTerms')}</dt>
              <dd>{contract.payment_terms || t('common.notSet')}</dd>
            </div>
            <div>
              <dt>{t('sales.contract.field.contractAmount')}</dt>
              <dd>{formatMoney(contract.statistics.total_amount, contract.currency)}</dd>
            </div>
            <div>
              <dt>{t('sales.contract.detail.purchasedShipped')}</dt>
              <dd>
                {contract.statistics.purchased_quantity} /{' '}
                {contract.statistics.shipped_quantity}
              </dd>
            </div>
            <div>
              <dt>{t('sales.contract.field.sourceQuotation')}</dt>
              <dd>{contract.source_quotation_no ?? t('sales.contract.detail.notLinked')}</dd>
            </div>
          </dl>

          <div className="transaction-box">
            <strong>{t('sales.contract.field.remarks')}</strong>
            <p>{contract.remarks ?? t('sales.contract.detail.noRemarks')}</p>
          </div>

          <div className="delivery-action-row">
            <Button
              disabled={contract.approval_status !== 'draft'}
              onClick={onLoadForEdit}
            >
              {t('sales.contract.action.loadForEdit')}
            </Button>
            {contract.approval_status === 'draft' ? (
              <ApprovalAssigneeSelect
                currentUserId={currentUser.id}
                onChange={approval.setReviewerId}
                requiredPermission="sales:contract:approve"
                value={approval.reviewerId}
              />
            ) : null}
            <Button
              disabled={contract.approval_status !== 'draft' || !approval.reviewerId}
              loading={approval.submitting}
              onClick={() => void approval.submitContractForApproval()}
            >
              {t('sales.contract.action.submitForApproval')}
            </Button>
            <Button
              disabled={
                contract.approval_status !== 'submitted' ||
                !canApproveAssignedRecord(
                  currentUser,
                  contract.reviewer_id,
                  'sales:contract:approve',
                )
              }
              loading={approval.submitting}
              type="primary"
              onClick={() => void approval.approveContract()}
            >
              {t('sales.contract.action.approve')}
            </Button>
            <Button
              loading={exportActions.submitting}
              onClick={() => void exportActions.exportContract('pdf')}
            >
              {t('sales.contract.action.exportPdf')}
            </Button>
            <Button onClick={() => void openExportContractPrint(contract.id)}>
              {t('sales.contract.action.print')}
            </Button>
            {['draft', 'approved', 'rejected'].includes(contract.approval_status) ? (
              <Button danger onClick={cancelActions.openCancelModal}>
                {t('sales.contract.action.cancel')}
              </Button>
            ) : null}
            {contract.approval_status === 'cancelled' ? (
              <Button type="primary" onClick={cancelActions.openReissueModal}>
                {t('sales.contract.action.reissue')}
              </Button>
            ) : null}
          </div>
          {contract.approval_status === 'submitted' &&
          !canApproveAssignedRecord(
            currentUser,
            contract.reviewer_id,
            'sales:contract:approve',
          ) ? (
            <Alert
              message={t('sales.contract.action.waitingApproval', {
                name: contract.reviewer_name ?? t('sales.contract.action.defaultReviewer'),
              })}
              showIcon
              type="info"
            />
          ) : null}

          {exportActions.exportPreview ? (
            <div className="transaction-box export-preview">
              <strong>{t('sales.contract.detail.exportPreview')}</strong>
              <pre>{exportActions.exportPreview}</pre>
            </div>
          ) : null}

          <div className="contract-detail-split">
            <form className="record-form accessory-form" onSubmit={signing.registerSignature}>
              <div className="form-divider">{t('sales.contract.detail.customerSignature')}</div>
              <div className="form-pair two">
                <label>
                  {t('sales.contract.field.signedBy')}
                  <Input
                    value={signing.signatureForm.signed_by}
                    onChange={(event) =>
                      signing.setSignatureForm({
                        ...signing.signatureForm,
                        signed_by: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('sales.contract.field.signedAt')}
                  <Input
                    type="date"
                    value={signing.signatureForm.signed_at}
                    onChange={(event) =>
                      signing.setSignatureForm({
                        ...signing.signatureForm,
                        signed_at: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  {t('sales.contract.field.signatureMethod')}
                  <Input
                    value={signing.signatureForm.signature_method}
                    onChange={(event) =>
                      signing.setSignatureForm({
                        ...signing.signatureForm,
                        signature_method: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('sales.contract.field.signatureFileNo')}
                  <Input
                    value={signing.signatureForm.file_no}
                    onChange={(event) =>
                      signing.setSignatureForm({
                        ...signing.signatureForm,
                        file_no: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <label>
                {t('sales.contract.field.signatureRemark')}
                <Input
                  value={signing.signatureForm.remark}
                  onChange={(event) =>
                    signing.setSignatureForm({
                      ...signing.signatureForm,
                      remark: event.target.value,
                    })
                  }
                />
              </label>
              <Button htmlType="submit" loading={signing.submitting}>
                {t('sales.contract.action.registerSignature')}
              </Button>
            </form>

            <form className="record-form accessory-form" onSubmit={signing.addAdvancePayment}>
              <div className="form-divider">{t('sales.contract.detail.advancePayment')}</div>
              <div className="form-pair two">
                <label>
                  {t('sales.contract.field.paymentNo')}
                  <Input readOnly value={signing.advancePaymentForm.payment_no} />
                </label>
                <label>
                  {t('sales.contract.field.receivedAt')}
                  <Input
                    type="date"
                    value={signing.advancePaymentForm.received_at}
                    onChange={(event) =>
                      signing.setAdvancePaymentForm({
                        ...signing.advancePaymentForm,
                        received_at: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <div className="form-pair two">
                <label>
                  {t('sales.contract.field.amount')}
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={signing.advancePaymentForm.amount}
                    onChange={(event) =>
                      signing.setAdvancePaymentForm({
                        ...signing.advancePaymentForm,
                        amount: event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  {t('sales.contract.field.payer')}
                  <Input
                    value={signing.advancePaymentForm.payer_name}
                    onChange={(event) =>
                      signing.setAdvancePaymentForm({
                        ...signing.advancePaymentForm,
                        payer_name: event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <label>
                {t('sales.contract.field.paymentRemark')}
                <Input
                  value={signing.advancePaymentForm.remark}
                  onChange={(event) =>
                    signing.setAdvancePaymentForm({
                      ...signing.advancePaymentForm,
                      remark: event.target.value,
                    })
                  }
                />
              </label>
              <Button htmlType="submit" loading={signing.submitting}>
                {t('sales.contract.action.linkAdvancePayment')}
              </Button>
            </form>
          </div>

          <Table<ExportContractLine>
            className="compact-section"
            columns={[
              {
                title: t('sales.contract.field.productCode'),
                dataIndex: 'product_code',
                render: nullableText,
              },
              { title: t('sales.contract.field.productName'), dataIndex: 'product_name' },
              { title: t('sales.contract.field.barcode'), dataIndex: 'barcode', render: nullableText },
              {
                title: t('sales.contract.field.specification'),
                dataIndex: 'specification',
                render: nullableText,
              },
              { title: t('sales.contract.field.model'), dataIndex: 'model', render: nullableText },
              {
                title: t('sales.contract.field.quantity'),
                dataIndex: 'quantity',
                render: (_, line) => `${line.quantity} ${line.unit}`,
              },
              {
                title: t('sales.contract.field.unitPrice'),
                dataIndex: 'unit_price',
                render: (_, line) => formatMoney(line.unit_price, contract.currency),
              },
              {
                title: t('sales.contract.field.amount'),
                dataIndex: 'amount',
                render: (_, line) => formatMoney(line.amount, contract.currency),
              },
              {
                title: t('sales.contract.field.purchasedQuantity'),
                dataIndex: 'purchased_quantity',
              },
              { title: t('sales.contract.field.shippedQuantity'), dataIndex: 'shipped_quantity' },
            ]}
            dataSource={contract.lines}
            locale={{ emptyText: t('sales.contract.detail.noLines') }}
            pagination={false}
            rowKey="id"
            size="small"
          />

          <div className="contract-media-row">
            <div className="product-photo compact-photo">
              {contract.lines[0]?.image_url ? (
                <img src={contract.lines[0].image_url} alt="" />
              ) : (
                <span>{t('sales.contract.detail.noImage')}</span>
              )}
            </div>
            <dl className="detail-list compact-detail-list">
              <div>
                <dt>{t('sales.contract.field.unpurchasedQuantity')}</dt>
                <dd>{contract.statistics.unpurchased_quantity}</dd>
              </div>
              <div>
                <dt>{t('sales.contract.field.unshippedAmount')}</dt>
                <dd>
                  {formatMoney(contract.statistics.unshipped_amount, contract.currency)}
                </dd>
              </div>
              <div>
                <dt>{t('sales.contract.field.advancePaymentTotal')}</dt>
                <dd>
                  {formatMoney(contract.statistics.advance_payment_amount, contract.currency)}
                </dd>
              </div>
              <div>
                <dt>{t('sales.contract.field.customerSignedAt')}</dt>
                <dd>{formatDate(contract.customer_signed_at)}</dd>
              </div>
            </dl>
          </div>

          <ExportContractDetailTables contract={contract} history={history} />
        </>
      ) : (
        <div className="module-state panel-empty-state">
          <FileStack size={28} />
          <strong>{t('sales.contract.detail.emptyTitle')}</strong>
          <span>{t('sales.contract.detail.emptyDescription')}</span>
        </div>
      )}
    </section>
  )
}
