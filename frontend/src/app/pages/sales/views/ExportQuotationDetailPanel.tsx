import { Alert, Button, Input, Table } from 'antd'
import { ArrowLeft, FileText, LayoutDashboard } from 'lucide-react'

import { PanelTitle } from '@/shared/ui'
import { formatDate, formatMoney, nullableText } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import { ApprovalAssigneeSelect } from '@/app/components/ApprovalAssigneeSelect'
import type {
  CurrentUser,
  ExportQuotation,
  ExportQuotationLine,
  ExportQuotationPurchaseReference,
  SampleDelivery,
} from '@/api'

import { exportQuotationStatusLabel, freightMethodLabel, sampleDeliveryStatusLabel } from '../exportQuotationHelpers'
import type { useExportQuotationWorkflow } from '../hooks/useExportQuotationWorkflow'

type Props = {
  quotation: ExportQuotation | null
  history: ExportQuotation[]
  purchaseReferences: ExportQuotationPurchaseReference[]
  sampleDeliveries: SampleDelivery[]
  workflow: ReturnType<typeof useExportQuotationWorkflow>
  currentUser: CurrentUser
  onBack: () => void
}

export function ExportQuotationDetailPanel({
  quotation,
  history,
  purchaseReferences,
  sampleDeliveries,
  workflow,
  currentUser,
  onBack,
}: Props) {
  return (
    <section className="workspace-panel detail-panel product-detail-panel">
      <div className="panel-heading toolbar-heading">
        <PanelTitle icon={<LayoutDashboard size={18} />} title={t('sales.quotation.detail.title')} />
        <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
          {t('sales.quotation.action.backToList')}
        </Button>
      </div>
      {quotation ? (
        <>
          <dl className="detail-list">
            <div>
              <dt>{t('sales.quotation.detail.statusDate')}</dt>
              <dd>
                {exportQuotationStatusLabel(quotation.approval_status)} /{' '}
                {formatDate(quotation.quote_date)}
              </dd>
            </div>
            <div>
              <dt>{t('sales.quotation.field.customer')}</dt>
              <dd>{quotation.customer_name}</dd>
            </div>
            <div>
              <dt>{t('sales.quotation.field.salesperson')}</dt>
              <dd>{quotation.sales_user_name ?? t('sales.quotation.detail.notFilled')}</dd>
            </div>
            <div>
              <dt>{t('sales.quotation.field.tradeTerm')}</dt>
              <dd>{quotation.trade_term}</dd>
            </div>
            <div>
              <dt>{t('sales.quotation.metric.quotationAmount')}</dt>
              <dd>{formatMoney(quotation.total_amount, quotation.currency)}</dd>
            </div>
            <div>
              <dt>{t('sales.quotation.field.reviewer')}</dt>
              <dd>{quotation.reviewer_name ?? t('sales.quotation.detail.notApproved')}</dd>
            </div>
            <div>
              <dt>{t('sales.quotation.field.contractNo')}</dt>
              <dd>
                {quotation.generated_contract_no ??
                  workflow.generatedContract?.contract_no ??
                  t('sales.quotation.detail.notGenerated')}
              </dd>
            </div>
            <div>
              <dt>{t('sales.quotation.field.validUntil')}</dt>
              <dd>{formatDate(quotation.valid_until)}</dd>
            </div>
          </dl>

          <div className="transaction-box">
            <strong>{t('sales.quotation.field.description')}</strong>
            <p>{quotation.description ?? t('sales.quotation.detail.noDescription')}</p>
          </div>

          <div className="delivery-action-row">
            <Button
              disabled={quotation.approval_status !== 'draft'}
              onClick={() => workflow.loadQuotationIntoForm(quotation)}
            >
              {t('sales.quotation.action.loadForEdit')}
            </Button>
            {quotation.approval_status === 'draft' ? (
              <ApprovalAssigneeSelect
                currentUserId={currentUser.id}
                onChange={workflow.setReviewerId}
                requiredPermission="sales:quotation:approve"
                value={workflow.reviewerId}
              />
            ) : null}
            <Button
              disabled={quotation.approval_status !== 'draft' || !workflow.reviewerId}
              loading={workflow.submitting}
              onClick={() => void workflow.submitQuotationForApproval()}
            >
              {t('sales.quotation.action.submitForApproval')}
            </Button>
            <Button
              disabled={
                quotation.approval_status !== 'submitted' ||
                !workflow.canApproveSelectedQuotation
              }
              loading={workflow.submitting}
              type="primary"
              onClick={() => void workflow.approveQuotation()}
            >
              {t('sales.quotation.action.approve')}
            </Button>
            <Button loading={workflow.submitting} onClick={() => void workflow.exportQuotation('pdf')}>
              {t('sales.quotation.action.exportPdf')}
            </Button>
          </div>
          {quotation.approval_status === 'submitted' && !workflow.canApproveSelectedQuotation ? (
            <Alert
              message={t('sales.quotation.action.waitingApproval', {
                name: quotation.reviewer_name ?? t('sales.quotation.action.defaultReviewer'),
              })}
              showIcon
              type="info"
            />
          ) : null}

          <form className="record-form accessory-form" onSubmit={workflow.confirmContract}>
            <div className="form-divider">{t('sales.quotation.detail.generateContractTitle')}</div>
            <div className="form-pair two">
              <label>
                {t('sales.quotation.field.confirmedAt')}
                <Input
                  type="date"
                  value={workflow.contractForm.confirmed_at}
                  onChange={(event) =>
                    workflow.setContractForm({
                      ...workflow.contractForm,
                      confirmed_at: event.target.value,
                    })
                  }
                />
              </label>
              <label>
                {t('sales.quotation.field.contractNo')}
                <Input
                  readOnly
                  value=""
                  placeholder={t('sales.quotation.form.codeAutoGenerated')}
                />
              </label>
            </div>
            <Button
              htmlType="submit"
              loading={workflow.submitting}
              disabled={!['approved', 'contract_generated'].includes(quotation.approval_status)}
            >
              {t('sales.quotation.action.generateContract')}
            </Button>
          </form>

          {workflow.generatedContract ? (
            <div className="transaction-box">
              <strong>{t('sales.quotation.detail.generatedContract')}</strong>
              <p>
                {workflow.generatedContract.contract_no} /{' '}
                {formatMoney(
                  workflow.generatedContract.total_amount,
                  workflow.generatedContract.currency,
                )}
              </p>
            </div>
          ) : null}

          {workflow.exportPreview ? (
            <div className="transaction-box export-preview">
              <strong>{t('sales.quotation.detail.exportPreview')}</strong>
              <pre>{workflow.exportPreview}</pre>
            </div>
          ) : null}

          <Table<ExportQuotationLine>
            className="compact-section"
            columns={[
              {
                title: t('sales.quotation.field.productCode'),
                dataIndex: 'product_code',
                render: nullableText,
              },
              { title: t('sales.quotation.field.productName'), dataIndex: 'product_name' },
              {
                title: t('sales.quotation.field.specification'),
                dataIndex: 'specification',
                render: nullableText,
              },
              {
                title: t('sales.quotation.field.model'),
                dataIndex: 'model',
                render: nullableText,
              },
              {
                title: t('sales.quotation.field.quantity'),
                dataIndex: 'quantity',
                render: (_, line) => `${line.quantity} ${line.unit}`,
              },
              { title: t('sales.quotation.field.unitPrice'), dataIndex: 'unit_price' },
              { title: t('sales.quotation.field.amount'), dataIndex: 'amount' },
              {
                title: t('sales.quotation.field.freightMethod'),
                dataIndex: 'freight_method',
                render: freightMethodLabel,
              },
              { title: t('sales.quotation.field.freightAmount'), dataIndex: 'freight_amount' },
            ]}
            dataSource={quotation.lines}
            locale={{ emptyText: t('sales.quotation.detail.noLines') }}
            pagination={false}
            rowKey="id"
            size="small"
          />

          <div className="accessory-heading">
            <strong>{t('sales.quotation.detail.historyTitle')}</strong>
            <span>{t('sales.quotation.detail.recordCount', { count: history.length })}</span>
          </div>
          <Table<ExportQuotation>
            columns={[
              { title: t('sales.quotation.field.quotation'), dataIndex: 'code' },
              { title: t('sales.quotation.field.customer'), dataIndex: 'customer_name' },
              {
                title: t('sales.quotation.field.date'),
                dataIndex: 'quote_date',
                render: formatDate,
              },
              {
                title: t('sales.quotation.field.status'),
                dataIndex: 'approval_status',
                render: exportQuotationStatusLabel,
              },
              {
                title: t('sales.quotation.field.amount'),
                dataIndex: 'total_amount',
                render: (_, item) => formatMoney(item.total_amount, item.currency),
              },
            ]}
            dataSource={history}
            locale={{ emptyText: t('sales.quotation.detail.noHistory') }}
            pagination={false}
            rowKey="id"
            size="small"
          />

          <div className="accessory-heading">
            <strong>{t('sales.quotation.detail.purchaseTitle')}</strong>
            <span>{t('sales.quotation.detail.recordCount', { count: purchaseReferences.length })}</span>
          </div>
          <table className="data-table compact-table">
            <thead>
              <tr>
                <th>{t('sales.quotation.field.supplier')}</th>
                <th>{t('sales.quotation.field.referencePrice')}</th>
                <th>{t('sales.quotation.field.date')}</th>
                <th>{t('sales.quotation.field.sourceNo')}</th>
              </tr>
            </thead>
            <tbody>
              {purchaseReferences.map((item) => (
                <tr key={`${item.source_quotation_no}-${item.supplier_name}`}>
                  <td>{item.supplier_name}</td>
                  <td>{formatMoney(item.reference_price, item.currency)}</td>
                  <td>{formatDate(item.quote_date)}</td>
                  <td>{item.source_quotation_no}</td>
                </tr>
              ))}
              {purchaseReferences.length === 0 ? (
                <tr>
                  <td className="empty-cell" colSpan={4}>
                    {t('sales.quotation.detail.noPurchase')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>

          <div className="accessory-heading">
            <strong>{t('sales.quotation.detail.sampleTitle')}</strong>
            <span>{t('sales.quotation.detail.recordCount', { count: sampleDeliveries.length })}</span>
          </div>
          <Table<SampleDelivery>
            columns={[
              { title: t('sales.quotation.field.sampleDeliveryNo'), dataIndex: 'code' },
              { title: t('sales.quotation.field.customer'), dataIndex: 'customer_name' },
              {
                title: t('sales.quotation.field.date'),
                dataIndex: 'delivery_date',
                render: formatDate,
              },
              {
                title: t('sales.quotation.field.status'),
                dataIndex: 'status',
                render: sampleDeliveryStatusLabel,
              },
              {
                title: t('sales.quotation.field.express'),
                dataIndex: 'express_company',
                render: (_, delivery) =>
                  `${delivery.express_company} / ${delivery.tracking_no ?? t('sales.quotation.detail.notFilled')}`,
              },
            ]}
            dataSource={sampleDeliveries}
            locale={{ emptyText: t('sales.quotation.detail.noSamples') }}
            pagination={false}
            rowKey="id"
            size="small"
          />
        </>
      ) : (
        <div className="module-state panel-empty-state">
          <FileText size={28} />
          <strong>{t('sales.quotation.detail.emptyTitle')}</strong>
          <span>{t('sales.quotation.detail.emptyDescription')}</span>
        </div>
      )}
    </section>
  )
}
