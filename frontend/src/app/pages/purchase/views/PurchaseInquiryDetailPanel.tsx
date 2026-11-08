import { Button } from 'antd'
import { ArrowLeft, FileText, LayoutDashboard } from 'lucide-react'

import { PanelTitle } from '@/shared/ui'
import { formatDate } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'

import { purchaseInquiryStatusLabel } from '../purchaseInquiryHelpers'
import type { usePurchaseInquiriesList } from '../hooks/usePurchaseInquiriesList'
import type { usePurchaseInquiryWorkflow } from '../hooks/usePurchaseInquiryWorkflow'
import { PurchaseInquiryDetailTables } from './PurchaseInquiryDetailTables'
import { PurchaseInquiryTemplateModal } from './PurchaseInquiryTemplateModal'
import { PurchaseQuotationModal } from './PurchaseQuotationModal'

type Props = {
  model: ReturnType<typeof usePurchaseInquiriesList>
  workflow: ReturnType<typeof usePurchaseInquiryWorkflow>
  onBack: () => void
}

export function PurchaseInquiryDetailPanel({ model, workflow, onBack }: Props) {
  const selectedInquiry = model.selectedInquiry

  return (
    <section className="workspace-panel detail-panel product-detail-panel">
      <div className="panel-heading toolbar-heading">
        <PanelTitle icon={<LayoutDashboard size={18} />} title={t('purchase.inquiry.detail.title')} />
        <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
          {t('purchase.inquiry.action.backToList')}
        </Button>
      </div>
      {selectedInquiry ? (
        <>
          <dl className="detail-list">
            <div>
              <dt>{t('purchase.inquiry.field.statusInquiryDate')}</dt>
              <dd>
                {purchaseInquiryStatusLabel(selectedInquiry.status)} /{' '}
                {formatDate(selectedInquiry.inquiry_date)}
              </dd>
            </div>
            <div>
              <dt>{t('purchase.inquiry.field.buyer')}</dt>
              <dd>
                {selectedInquiry.buyer_user_name ?? t('purchase.inquiry.detail.unassigned')}
              </dd>
            </div>
            <div>
              <dt>{t('purchase.inquiry.field.template')}</dt>
              <dd>{selectedInquiry.template_name ?? t('purchase.inquiry.detail.notSent')}</dd>
            </div>
            <div>
              <dt>{t('purchase.inquiry.field.templateSentAt')}</dt>
              <dd>{formatDate(selectedInquiry.template_sent_at)}</dd>
            </div>
          </dl>

          <div className="transaction-box">
            <strong>{t('purchase.inquiry.field.remarks')}</strong>
            <p>{selectedInquiry.remarks ?? t('purchase.inquiry.detail.remarksEmpty')}</p>
          </div>

          <div className="delivery-action-row">
            <Button
              disabled={selectedInquiry.status !== 'draft'}
              onClick={workflow.loadSelectedInquiryForEdit}
            >
              {t('purchase.inquiry.action.editInquiry')}
            </Button>
            <Button htmlType="button" onClick={() => workflow.setActionModal('template')}>
              {t('purchase.inquiry.action.sendTemplate')}
            </Button>
            <Button
              disabled={!selectedInquiry.lines[0]}
              htmlType="button"
              type="primary"
              onClick={() => workflow.setActionModal('quotation')}
            >
              {t('purchase.inquiry.action.addQuotation')}
            </Button>
          </div>

          <PurchaseInquiryTemplateModal workflow={workflow} />
          <PurchaseQuotationModal workflow={workflow} />

          {workflow.templatePreview ? (
            <div className="transaction-box export-preview">
              <strong>{t('purchase.inquiry.detail.templatePreviewTitle')}</strong>
              <pre>{workflow.templatePreview}</pre>
            </div>
          ) : null}

          <PurchaseInquiryDetailTables
            inquiry={selectedInquiry}
            supplierSamples={model.supplierSamples}
            references={model.references}
          />
        </>
      ) : (
        <div className="module-state panel-empty-state">
          <FileText size={28} />
          <strong>{t('purchase.inquiry.detail.emptyTitle')}</strong>
          <span>{t('purchase.inquiry.detail.emptyDescription')}</span>
        </div>
      )}
    </section>
  )
}
