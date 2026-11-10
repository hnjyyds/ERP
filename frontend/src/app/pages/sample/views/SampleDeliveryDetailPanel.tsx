import { Alert, Button, Input, Table } from 'antd'
import { ArrowLeft, LayoutDashboard, Send } from 'lucide-react'
import type { FormEvent } from 'react'
import {
  type CurrentUser,
  type SampleDelivery,
  type SampleDeliveryCustomerStatistic,
  type SampleDeliveryExpressStatistic,
  type SampleDeliveryFee,
  type SampleDeliveryFeeStatistic,
  type SampleDeliveryFeeStatistics,
  type SampleDeliveryLine,
  type SampleDeliveryStatistics,
  type SampleDeliveryStatusStatistic,
} from '@/api'
import { t } from '@/app/appI18n'
import { FormSelect, PanelTitle } from '@/shared/ui'
import {
  canApproveAssignedRecord,
  formatDate,
  formatMoney,
  nullableText,
} from '@/app/pages/appHelpers'
import { sampleDeliveryTrackingStatusOptions } from '@/shared/formOptions'
import { ApprovalAssigneeSelect } from '@/app/components/ApprovalAssigneeSelect'
import {
  sampleDeliveryFeeTypeLabel,
  sampleDeliveryPayerTypeLabel,
  sampleDeliveryStatusLabel,
  sampleRecordTypeLabel,
  type SampleDeliveryTrackingFormState,
} from '../sampleDeliveryHelpers'

type Props = {
  selectedDelivery: SampleDelivery | null
  currentUser: CurrentUser
  reviewerId: string
  submitting: boolean
  trackingForm: SampleDeliveryTrackingFormState
  feeStatistics: SampleDeliveryFeeStatistics
  deliveryStatistics: SampleDeliveryStatistics
  sampleHistory: SampleDelivery[]
  quoteHistory: SampleDelivery[]
  onBack: () => void
  onEdit: (delivery: SampleDelivery) => void
  onSubmitReview: () => void
  onApprove: () => void
  onWithdraw: () => void
  onOpenReject: () => void
  onSubmitTracking: (event: FormEvent<HTMLFormElement>) => void
  onReviewerChange: (reviewerId: string) => void
  onTrackingFormChange: (form: SampleDeliveryTrackingFormState) => void
}

export function SampleDeliveryDetailPanel({
  selectedDelivery,
  currentUser,
  reviewerId,
  submitting,
  trackingForm,
  feeStatistics,
  deliveryStatistics,
  sampleHistory,
  quoteHistory,
  onBack,
  onEdit,
  onSubmitReview,
  onApprove,
  onWithdraw,
  onOpenReject,
  onSubmitTracking,
  onReviewerChange,
  onTrackingFormChange,
}: Props) {
  // 物流只能在审批通过后写入；已发货后不允许再回退状态。
  const trackingEditable = Boolean(
    selectedDelivery && ['approved', 'shipped'].includes(selectedDelivery.status),
  )
  const trackingStatusOptions = trackingEditable
    ? sampleDeliveryTrackingStatusOptions.filter(
        (item) =>
          item.value !== 'submitted' &&
          (selectedDelivery?.status !== 'shipped' || item.value === 'shipped'),
      )
    : sampleDeliveryTrackingStatusOptions
  return (
    <section className="workspace-panel detail-panel product-detail-panel">
      <div className="panel-heading toolbar-heading">
        <PanelTitle
          icon={<LayoutDashboard size={18} />}
          title={t('sample.delivery.panel.detailTitle')}
        />
        <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
          {t('sample.delivery.action.backToList')}
        </Button>
      </div>
      {selectedDelivery ? (
        <>
          <dl className="detail-list">
            <div>
              <dt>{t('sample.delivery.field.statusDate')}</dt>
              <dd>
                {sampleDeliveryStatusLabel(selectedDelivery.status)} /{' '}
                {formatDate(selectedDelivery.delivery_date)}
              </dd>
            </div>
            <div>
              <dt>{t('sample.delivery.field.customer')}</dt>
              <dd>{selectedDelivery.customer_name}</dd>
            </div>
            <div>
              <dt>{t('sample.delivery.field.supplierFactory')}</dt>
              <dd>
                {selectedDelivery.supplier_name ?? t('sample.delivery.panel.notFilled')} /{' '}
                {selectedDelivery.factory_name ?? t('sample.delivery.panel.notFilled')}
              </dd>
            </div>
            <div>
              <dt>{t('sample.delivery.field.recipient')}</dt>
              <dd>
                {selectedDelivery.recipient_name} /{' '}
                {selectedDelivery.recipient_company ?? t('sample.delivery.panel.notFilled')}
              </dd>
            </div>
            <div>
              <dt>{t('sample.delivery.field.express')}</dt>
              <dd>
                {selectedDelivery.express_company} /{' '}
                {selectedDelivery.tracking_no ?? t('sample.delivery.panel.notFilled')}
              </dd>
            </div>
            <div>
              <dt>{t('sample.delivery.field.quote')}</dt>
              <dd>{selectedDelivery.quotation_no ?? t('sample.delivery.panel.notLinked')}</dd>
            </div>
            <div>
              <dt>{t('sample.delivery.field.feeTotal')}</dt>
              <dd>
                {formatMoney(
                  selectedDelivery.fee_total,
                  selectedDelivery.fees[0]?.currency ?? 'USD',
                )}
              </dd>
            </div>
            <div>
              <dt>{t('sample.delivery.field.reviewer')}</dt>
              <dd>{selectedDelivery.reviewer_name ?? t('sample.delivery.panel.notReviewed')}</dd>
            </div>
          </dl>

          <div className="transaction-box">
            <strong>{t('sample.delivery.field.remark')}</strong>
            <p>{selectedDelivery.remark ?? selectedDelivery.recipient_address}</p>
          </div>

          {selectedDelivery.rejection_reason ? (
            <Alert
              description={
                selectedDelivery.rejected_at
                  ? t('sample.delivery.panel.rejectedAt', {
                      date: formatDate(selectedDelivery.rejected_at),
                    })
                  : undefined
              }
              showIcon
              title={t('sample.delivery.panel.rejectionReason', {
                reason: selectedDelivery.rejection_reason,
              })}
              type="warning"
            />
          ) : null}

          <div className="delivery-action-row">
            <Button
              disabled={!['draft', 'rejected'].includes(selectedDelivery.status)}
              onClick={() => onEdit(selectedDelivery)}
            >
              {t('sample.delivery.action.editDraft')}
            </Button>
            {selectedDelivery.status === 'draft' ? (
              <ApprovalAssigneeSelect
                currentUserId={currentUser.id}
                onChange={onReviewerChange}
                requiredPermission="sample:delivery:approve"
                value={reviewerId}
              />
            ) : null}
            <Button
              disabled={selectedDelivery.status !== 'draft' || !reviewerId}
              loading={submitting}
              onClick={onSubmitReview}
            >
              {t('sample.delivery.action.submitReview')}
            </Button>
            <Button
              disabled={
                selectedDelivery.status !== 'submitted' ||
                !canApproveAssignedRecord(
                  currentUser,
                  selectedDelivery.reviewer_id,
                  'sample:delivery:approve',
                )
              }
              loading={submitting}
              type="primary"
              onClick={onApprove}
            >
              {t('sample.delivery.action.approve')}
            </Button>
            {selectedDelivery.status === 'submitted' ? (
              <>
                <Button
                  disabled={
                    !(
                      selectedDelivery.owner_user_id === currentUser.id ||
                      currentUser.permissions.includes('system:super_admin')
                    )
                  }
                  loading={submitting}
                  onClick={onWithdraw}
                >
                  {t('sample.delivery.action.withdraw')}
                </Button>
                <Button
                  danger
                  disabled={
                    !canApproveAssignedRecord(
                      currentUser,
                      selectedDelivery.reviewer_id,
                      'sample:delivery:approve',
                    )
                  }
                  loading={submitting}
                  onClick={onOpenReject}
                >
                  {t('sample.delivery.action.reject')}
                </Button>
              </>
            ) : null}
          </div>
          {selectedDelivery.status === 'submitted' &&
          !canApproveAssignedRecord(
            currentUser,
            selectedDelivery.reviewer_id,
            'sample:delivery:approve',
          ) ? (
            <Alert
              message={t('sample.delivery.message.awaitingReview', {
                reviewer:
                  selectedDelivery.reviewer_name ?? t('sample.delivery.panel.designatedReviewer'),
              })}
              showIcon
              type="info"
            />
          ) : null}

          <form className="record-form accessory-form" onSubmit={onSubmitTracking}>
            <div className="form-divider">{t('sample.delivery.panel.trackingSection')}</div>
            <div className="form-pair three">
              <label>
                {t('sample.delivery.field.expressCompany')}
                <Input
                  disabled={!trackingEditable}
                  value={trackingForm.express_company}
                  onChange={(event) =>
                    onTrackingFormChange({ ...trackingForm, express_company: event.target.value })
                  }
                />
              </label>
              <label>
                {t('sample.delivery.field.trackingNo')}
                <Input
                  disabled={!trackingEditable}
                  value={trackingForm.tracking_no}
                  onChange={(event) =>
                    onTrackingFormChange({ ...trackingForm, tracking_no: event.target.value })
                  }
                />
              </label>
              <label>
                {t('sample.delivery.field.trackingStatus')}
                <FormSelect
                  disabled={!trackingEditable}
                  value={trackingForm.status}
                  onChange={(event) =>
                    onTrackingFormChange({ ...trackingForm, status: event.target.value })
                  }
                >
                  {trackingStatusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {t(item.labelKey)}
                    </option>
                  ))}
                </FormSelect>
              </label>
            </div>
            <Button disabled={!trackingEditable} htmlType="submit" loading={submitting}>
              {t('sample.delivery.action.updateTracking')}
            </Button>
          </form>

          <Table<SampleDeliveryLine>
            className="compact-section"
            columns={[
              {
                title: t('sample.delivery.table.sampleCode'),
                dataIndex: 'sample_code',
                render: nullableText,
              },
              {
                title: t('sample.delivery.table.product'),
                dataIndex: 'product_name',
                render: (_, line) =>
                  `${line.product_code ?? t('sample.delivery.panel.notFilled')} / ${line.product_name}`,
              },
              {
                title: t('sample.delivery.table.quantity'),
                dataIndex: 'quantity',
                render: (_, line) => `${line.quantity} ${line.unit}`,
              },
              {
                title: t('sample.delivery.table.type'),
                dataIndex: 'sample_type',
                render: sampleRecordTypeLabel,
              },
              {
                title: t('sample.delivery.table.note'),
                dataIndex: 'remark',
                render: nullableText,
              },
            ]}
            dataSource={selectedDelivery.lines}
            locale={{ emptyText: t('sample.delivery.panel.noLines') }}
            pagination={false}
            rowKey="id"
            size="small"
          />

          <Table<SampleDeliveryFee>
            className="compact-section"
            columns={[
              {
                title: t('sample.delivery.table.feeType'),
                dataIndex: 'fee_type',
                render: sampleDeliveryFeeTypeLabel,
              },
              {
                title: t('sample.delivery.table.amount'),
                dataIndex: 'amount',
                render: (_, fee) => formatMoney(fee.amount, fee.currency),
              },
              {
                title: t('sample.delivery.table.payerType'),
                dataIndex: 'payer_type',
                render: sampleDeliveryPayerTypeLabel,
              },
              {
                title: t('sample.delivery.table.note'),
                dataIndex: 'remark',
                render: nullableText,
              },
            ]}
            dataSource={selectedDelivery.fees}
            locale={{ emptyText: t('sample.delivery.panel.noFees') }}
            pagination={false}
            rowKey="id"
            size="small"
          />

          <div className="accessory-heading">
            <strong>{t('sample.delivery.panel.feeStatistics')}</strong>
            <span>{formatMoney(feeStatistics.total_amount, feeStatistics.currency)}</span>
          </div>
          <Table<SampleDeliveryFeeStatistic>
            columns={[
              { title: t('sample.delivery.table.customer'), dataIndex: 'customer_name' },
              { title: t('sample.delivery.table.expressCompany'), dataIndex: 'express_company' },
              { title: t('sample.delivery.table.deliveryCount'), dataIndex: 'delivery_count' },
              {
                title: t('sample.delivery.table.feeTotal'),
                dataIndex: 'total_amount',
                render: (_, item) => formatMoney(item.total_amount, item.currency),
              },
            ]}
            dataSource={feeStatistics.items}
            locale={{ emptyText: t('sample.delivery.panel.noApprovedFees') }}
            pagination={false}
            rowKey={(item) =>
              `${item.customer_id ?? 'none'}-${item.express_company}-${item.currency}`
            }
            size="small"
          />

          <div className="accessory-heading">
            <strong>{t('sample.delivery.panel.deliveryStatistics')}</strong>
            <span>
              {t('sample.delivery.panel.deliveryCount', {
                count: deliveryStatistics.total_deliveries,
              })}{' '}
              /{' '}
              {t('sample.delivery.panel.itemCount', {
                count: deliveryStatistics.total_quantity,
              })}
            </span>
          </div>
          <Table<SampleDeliveryStatusStatistic>
            columns={[
              {
                title: t('sample.delivery.table.status'),
                dataIndex: 'status',
                render: sampleDeliveryStatusLabel,
              },
              { title: t('sample.delivery.table.deliveryCount'), dataIndex: 'delivery_count' },
              { title: t('sample.delivery.table.totalQuantity'), dataIndex: 'total_quantity' },
            ]}
            dataSource={deliveryStatistics.by_status}
            locale={{ emptyText: t('sample.delivery.panel.noStatusStatistics') }}
            pagination={false}
            rowKey="status"
            size="small"
          />
          <Table<SampleDeliveryCustomerStatistic>
            className="compact-section"
            columns={[
              { title: t('sample.delivery.table.customer'), dataIndex: 'customer_name' },
              { title: t('sample.delivery.table.deliveryCount'), dataIndex: 'delivery_count' },
              { title: t('sample.delivery.table.totalQuantity'), dataIndex: 'total_quantity' },
            ]}
            dataSource={deliveryStatistics.by_customer}
            locale={{ emptyText: t('sample.delivery.panel.noCustomerStatistics') }}
            pagination={false}
            rowKey={(item) => item.customer_id ?? item.customer_name}
            size="small"
          />
          <Table<SampleDeliveryExpressStatistic>
            className="compact-section"
            columns={[
              { title: t('sample.delivery.table.expressCompany'), dataIndex: 'express_company' },
              { title: t('sample.delivery.table.deliveryCount'), dataIndex: 'delivery_count' },
              { title: t('sample.delivery.table.totalQuantity'), dataIndex: 'total_quantity' },
            ]}
            dataSource={deliveryStatistics.by_express}
            locale={{ emptyText: t('sample.delivery.panel.noExpressStatistics') }}
            pagination={false}
            rowKey="express_company"
            size="small"
          />

          <div className="accessory-heading">
            <strong>{t('sample.delivery.panel.sampleHistory')}</strong>
            <span>{t('sample.delivery.panel.recordCount', { count: sampleHistory.length })}</span>
          </div>
          <Table<SampleDelivery>
            columns={[
              { title: t('sample.delivery.table.deliveryCode'), dataIndex: 'code' },
              { title: t('sample.delivery.table.customer'), dataIndex: 'customer_name' },
              {
                title: t('sample.delivery.table.date'),
                dataIndex: 'delivery_date',
                render: formatDate,
              },
              {
                title: t('sample.delivery.table.status'),
                dataIndex: 'status',
                render: sampleDeliveryStatusLabel,
              },
              {
                title: t('sample.delivery.table.express'),
                dataIndex: 'express_company',
                render: (_, delivery) =>
                  `${delivery.express_company} / ${delivery.tracking_no ?? t('sample.delivery.panel.notFilled')}`,
              },
            ]}
            dataSource={sampleHistory}
            locale={{ emptyText: t('sample.delivery.panel.noSampleHistory') }}
            pagination={false}
            rowKey="id"
            size="small"
          />

          <div className="accessory-heading">
            <strong>{t('sample.delivery.panel.quoteHistory')}</strong>
            <span>{t('sample.delivery.panel.recordCount', { count: quoteHistory.length })}</span>
          </div>
          <Table<SampleDelivery>
            columns={[
              {
                title: t('sample.delivery.table.quote'),
                dataIndex: 'quotation_no',
                render: nullableText,
              },
              { title: t('sample.delivery.table.deliveryCode'), dataIndex: 'code' },
              { title: t('sample.delivery.table.customer'), dataIndex: 'customer_name' },
              {
                title: t('sample.delivery.table.product'),
                dataIndex: 'lines',
                render: (_, delivery) =>
                  delivery.lines[0]?.product_name ?? t('sample.delivery.panel.notFilled'),
              },
              {
                title: t('sample.delivery.table.approvedAt'),
                dataIndex: 'approved_at',
                render: formatDate,
              },
            ]}
            dataSource={quoteHistory}
            locale={{ emptyText: t('sample.delivery.panel.noQuoteHistory') }}
            pagination={false}
            rowKey="id"
            size="small"
          />
        </>
      ) : (
        <div className="module-state panel-empty-state">
          <Send size={28} />
          <strong>{t('sample.delivery.panel.emptyTitle')}</strong>
          <span>{t('sample.delivery.panel.emptyDescription')}</span>
        </div>
      )}
    </section>
  )
}
