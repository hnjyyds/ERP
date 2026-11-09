import { Button, Input, Table } from 'antd'
import { ArrowLeft, FlaskConical, LayoutDashboard, Search } from 'lucide-react'
import type { Dispatch, FormEvent, SetStateAction } from 'react'
import type { CurrentUser, SampleFee, SampleProgress, SampleRequest } from '@/api'
import { t } from '@/app/appI18n'
import { formatDate, nullableText } from '@/app/pages/appHelpers'
import { ApprovalAssigneeSelect } from '@/app/components/ApprovalAssigneeSelect'
import { FormSelect, PanelTitle } from '@/shared/ui'
import { openSampleRequestPrint } from '@/shared/print'
import {
  sampleFeeTypeOptions,
  samplePayeeTypeOptions,
  sampleProgressStageOptions,
  sampleRecordTypeOptions,
  sampleStatusOptions,
} from '@/shared/formOptions'
import {
  sampleDestinationLabel,
  sampleFeeTypeLabel,
  samplePaymentStatusLabel,
  sampleProgressStageLabel,
  sampleStatusLabel,
  type SampleFeeFormState,
  type SampleProgressFormState,
  type SampleRecordFormState,
} from '@/app/pages/sample/sampleRequestHelpers'

type Props = {
  selectedRequest: SampleRequest | null
  currentUser: CurrentUser
  onBack: () => void
  submitting: boolean
  progressForm: SampleProgressFormState
  setProgressForm: Dispatch<SetStateAction<SampleProgressFormState>>
  submitProgress: (event: FormEvent<HTMLFormElement>) => void
  feeForm: SampleFeeFormState
  setFeeForm: Dispatch<SetStateAction<SampleFeeFormState>>
  submitFee: (event: FormEvent<HTMLFormElement>) => void
  paymentReviewerId: string
  setPaymentReviewerId: Dispatch<SetStateAction<string>>
  submitPaymentRequest: (fee: SampleFee) => void
  recordForm: SampleRecordFormState
  setRecordForm: Dispatch<SetStateAction<SampleRecordFormState>>
  loadRequestIntoRecordForm: (request: SampleRequest) => void
  submitRecordFromRequest: (event: FormEvent<HTMLFormElement>) => void
}

export function SampleRequestDetailPanel({
  selectedRequest,
  currentUser,
  onBack,
  submitting,
  progressForm,
  setProgressForm,
  submitProgress,
  feeForm,
  setFeeForm,
  submitFee,
  paymentReviewerId,
  setPaymentReviewerId,
  submitPaymentRequest,
  recordForm,
  setRecordForm,
  loadRequestIntoRecordForm,
  submitRecordFromRequest,
}: Props) {
  return (
    <section className="workspace-panel detail-panel product-detail-panel">
      <div className="panel-heading toolbar-heading">
        <PanelTitle
          icon={<LayoutDashboard size={18} />}
          title={t('sample.request.panel.detailTitle')}
        />
        <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
          {t('sample.request.action.backToList')}
        </Button>
      </div>
      {selectedRequest ? (
        <>
          <dl className="detail-list">
            <div>
              <dt>{t('sample.request.field.code')}</dt>
              <dd>{selectedRequest.code}</dd>
            </div>
            <div>
              <dt>{t('sample.request.field.customerProduct')}</dt>
              <dd>
                {selectedRequest.customer_name} / {selectedRequest.product_name ?? '-'}
              </dd>
            </div>
            <div>
              <dt>{t('sample.request.field.destinationStatus')}</dt>
              <dd>
                {sampleDestinationLabel(selectedRequest.destination)} /{' '}
                {sampleStatusLabel(selectedRequest.status)}
              </dd>
            </div>
            <div>
              <dt>{t('sample.request.field.supplier')}</dt>
              <dd>{selectedRequest.supplier_name ?? t('sample.request.panel.notSet')}</dd>
            </div>
            <div>
              <dt>{t('sample.request.field.requestDate')}</dt>
              <dd>{formatDate(selectedRequest.request_date)}</dd>
            </div>
            <div>
              <dt>{t('sample.request.field.dueDateShort')}</dt>
              <dd>{formatDate(selectedRequest.due_date)}</dd>
            </div>
            <div>
              <dt>{t('sample.request.field.customerRequirement')}</dt>
              <dd>{selectedRequest.requirements}</dd>
            </div>
          </dl>

          <div className="delivery-action-row">
            <Button onClick={() => void openSampleRequestPrint(selectedRequest.id)}>
              {t('sample.request.action.print')}
            </Button>
            <Button
              disabled={selectedRequest.status !== 'completed'}
              onClick={() => loadRequestIntoRecordForm(selectedRequest)}
            >
              {t('sample.request.action.loadAsSample')}
            </Button>
          </div>

          <section className="compact-section">
            <PanelTitle icon={<Search size={18} />} title={t('sample.request.panel.lineTitle')} />
            <Table
              columns={[
                {
                  title: t('sample.request.table.productCode'),
                  dataIndex: 'product_code',
                  render: nullableText,
                },
                { title: t('sample.request.table.productName'), dataIndex: 'product_name' },
                {
                  title: t('sample.request.table.specification'),
                  dataIndex: 'specification',
                  render: nullableText,
                },
                { title: t('sample.request.table.quantity'), dataIndex: 'quantity', width: 90 },
                { title: t('sample.request.table.unit'), dataIndex: 'unit', width: 80 },
                {
                  title: t('sample.request.table.requirement'),
                  dataIndex: 'requirement',
                  render: nullableText,
                },
              ]}
              dataSource={selectedRequest.lines}
              pagination={false}
              rowKey="id"
              size="small"
            />
          </section>

          <form className="record-form compact-section" onSubmit={submitProgress}>
            <div className="form-divider">{t('sample.request.panel.progressTitle')}</div>
            <label>
              {t('sample.request.field.progressStage')}
              <FormSelect
                value={progressForm.stage}
                onChange={(event) =>
                  setProgressForm({ ...progressForm, stage: event.target.value })
                }
              >
                {sampleProgressStageOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              {t('sample.request.field.progressStatus')}
              <FormSelect
                value={progressForm.status}
                onChange={(event) =>
                  setProgressForm({ ...progressForm, status: event.target.value })
                }
              >
                {sampleStatusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              {t('sample.request.field.progressDate')}
              <Input
                type="date"
                value={progressForm.occurred_at}
                onChange={(event) =>
                  setProgressForm({ ...progressForm, occurred_at: event.target.value })
                }
              />
            </label>
            <label>
              {t('sample.request.field.progressHandler')}
              <Input
                value={progressForm.handler_name}
                onChange={(event) =>
                  setProgressForm({ ...progressForm, handler_name: event.target.value })
                }
              />
            </label>
            <label>
              {t('sample.request.field.progressNote')}
              <Input.TextArea
                rows={2}
                value={progressForm.note}
                onChange={(event) => setProgressForm({ ...progressForm, note: event.target.value })}
              />
            </label>
            <Button htmlType="submit" loading={submitting} type="primary">
              {t('sample.request.action.updateProgress')}
            </Button>
          </form>

          <Table<SampleProgress>
            className="compact-section"
            columns={[
              {
                title: t('sample.request.table.stage'),
                dataIndex: 'stage',
                render: sampleProgressStageLabel,
              },
              {
                title: t('sample.request.table.status'),
                dataIndex: 'status',
                render: sampleStatusLabel,
              },
              {
                title: t('sample.request.table.date'),
                dataIndex: 'occurred_at',
                render: formatDate,
              },
              {
                title: t('sample.request.table.handler'),
                dataIndex: 'handler_name',
                render: nullableText,
              },
              {
                title: t('sample.request.table.note'),
                dataIndex: 'note',
                render: nullableText,
              },
            ]}
            dataSource={selectedRequest.progress_events}
            locale={{ emptyText: t('sample.request.panel.noProgress') }}
            pagination={false}
            rowKey="id"
            size="small"
          />

          <form className="record-form compact-section" onSubmit={submitFee}>
            <div className="form-divider">{t('sample.request.panel.feeTitle')}</div>
            <label>
              {t('sample.request.field.feeType')}
              <FormSelect
                value={feeForm.fee_type}
                onChange={(event) => setFeeForm({ ...feeForm, fee_type: event.target.value })}
              >
                {sampleFeeTypeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              {t('sample.request.field.feeAmount')}
              <Input
                type="number"
                min="0"
                step="0.01"
                value={feeForm.amount}
                onChange={(event) => setFeeForm({ ...feeForm, amount: event.target.value })}
              />
            </label>
            <label>
              {t('sample.request.field.feeCurrency')}
              <Input
                value={feeForm.currency}
                onChange={(event) => setFeeForm({ ...feeForm, currency: event.target.value })}
              />
            </label>
            <label>
              {t('sample.request.field.payeeType')}
              <FormSelect
                value={feeForm.payee_type}
                onChange={(event) => setFeeForm({ ...feeForm, payee_type: event.target.value })}
              >
                {samplePayeeTypeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              {t('sample.request.field.payeeName')}
              <Input
                value={feeForm.payee_name}
                onChange={(event) => setFeeForm({ ...feeForm, payee_name: event.target.value })}
              />
            </label>
            <label>
              {t('sample.request.field.feeRemark')}
              <Input.TextArea
                rows={2}
                value={feeForm.remark}
                onChange={(event) => setFeeForm({ ...feeForm, remark: event.target.value })}
              />
            </label>
            <Button htmlType="submit" loading={submitting}>
              {t('sample.request.action.registerFee')}
            </Button>
          </form>

          {selectedRequest.fees.some((fee) => !fee.payment_request_no) ? (
            <ApprovalAssigneeSelect
              currentUserId={currentUser.id}
              label={t('sample.request.field.paymentReviewer')}
              onChange={setPaymentReviewerId}
              requiredPermission="finance:view"
              value={paymentReviewerId}
            />
          ) : null}

          <Table<SampleFee>
            className="compact-section"
            columns={[
              {
                title: t('sample.request.table.feeType'),
                dataIndex: 'fee_type',
                render: sampleFeeTypeLabel,
              },
              {
                title: t('sample.request.table.amount'),
                dataIndex: 'amount',
                render: (_, record) => `${record.currency} ${record.amount}`,
              },
              { title: t('sample.request.table.payee'), dataIndex: 'payee_name' },
              {
                title: t('sample.request.table.paymentStatus'),
                dataIndex: 'payment_status',
                render: samplePaymentStatusLabel,
              },
              {
                title: t('sample.request.table.paymentRequest'),
                dataIndex: 'payment_request_no',
                render: nullableText,
              },
              {
                title: t('sample.request.table.operation'),
                dataIndex: 'id',
                width: 120,
                render: (_, record) => (
                  <Button
                    disabled={Boolean(record.payment_request_no) || !paymentReviewerId}
                    loading={submitting}
                    size="small"
                    onClick={() => void submitPaymentRequest(record)}
                  >
                    {t('sample.request.action.requestPayment')}
                  </Button>
                ),
              },
            ]}
            dataSource={selectedRequest.fees}
            locale={{ emptyText: t('sample.request.panel.noFees') }}
            pagination={false}
            rowKey="id"
            size="small"
          />

          <form className="record-form compact-section" onSubmit={submitRecordFromRequest}>
            <div className="form-divider">{t('sample.request.panel.recordTitle')}</div>
            <div className="form-pair three">
              <label>
                {t('sample.request.field.sampleCode')}
                <Input
                  readOnly
                  value={recordForm.code}
                  placeholder={t('sample.record.form.codeAutoGenerated')}
                />
              </label>
              <label>
                {t('sample.request.field.sampleType')}
                <FormSelect
                  value={recordForm.sample_type}
                  onChange={(event) =>
                    setRecordForm({ ...recordForm, sample_type: event.target.value })
                  }
                >
                  {sampleRecordTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {t(item.labelKey)}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label>
                {t('sample.request.field.receivedQuantity')}
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={recordForm.quantity}
                  onChange={(event) =>
                    setRecordForm({ ...recordForm, quantity: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair three">
              <label>
                {t('sample.request.field.receivedAt')}
                <Input
                  type="date"
                  value={recordForm.received_at}
                  onChange={(event) =>
                    setRecordForm({ ...recordForm, received_at: event.target.value })
                  }
                />
              </label>
              <label>
                {t('sample.request.field.submittedAt')}
                <Input
                  type="date"
                  value={recordForm.submitted_at}
                  onChange={(event) =>
                    setRecordForm({ ...recordForm, submitted_at: event.target.value })
                  }
                />
              </label>
              <label>
                {t('sample.request.field.unit')}
                <Input
                  value={recordForm.unit}
                  onChange={(event) => setRecordForm({ ...recordForm, unit: event.target.value })}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                {t('sample.request.field.customerSku')}
                <Input
                  value={recordForm.customer_sku}
                  onChange={(event) =>
                    setRecordForm({ ...recordForm, customer_sku: event.target.value })
                  }
                />
              </label>
              <label>
                {t('sample.request.field.supplierSku')}
                <Input
                  value={recordForm.supplier_sku}
                  onChange={(event) =>
                    setRecordForm({ ...recordForm, supplier_sku: event.target.value })
                  }
                />
              </label>
            </div>
            <div className="form-pair two">
              <label>
                {t('sample.request.field.purchaseContractId')}
                <Input
                  value={recordForm.purchase_contract_id}
                  onChange={(event) =>
                    setRecordForm({ ...recordForm, purchase_contract_id: event.target.value })
                  }
                />
              </label>
              <label>
                {t('sample.request.field.purchaseContractNo')}
                <Input
                  value={recordForm.purchase_contract_no}
                  onChange={(event) =>
                    setRecordForm({ ...recordForm, purchase_contract_no: event.target.value })
                  }
                />
              </label>
            </div>
            <label>
              {t('sample.request.field.description')}
              <Input.TextArea
                rows={2}
                value={recordForm.description}
                onChange={(event) =>
                  setRecordForm({ ...recordForm, description: event.target.value })
                }
              />
            </label>
            <Button
              disabled={selectedRequest.status !== 'completed'}
              htmlType="submit"
              loading={submitting}
              type="primary"
            >
              {t('sample.request.action.convertToRecord')}
            </Button>
          </form>
        </>
      ) : (
        <div className="module-state panel-empty-state">
          <FlaskConical size={28} />
          <strong>{t('sample.request.panel.emptyTitle')}</strong>
          <span>{t('sample.request.panel.emptyDescription')}</span>
        </div>
      )}
    </section>
  )
}
