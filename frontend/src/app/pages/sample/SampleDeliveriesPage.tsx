import { Alert } from 'antd'
import type { FormEvent, MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  approveSampleDelivery,
  createSampleDelivery,
  exportSampleDeliveries,
  getSampleDeliveryFeeStatistics,
  getSampleDeliveryQuoteHistory,
  getSampleDeliverySampleHistory,
  getSampleDeliveryStatistics,
  listSampleDeliveries,
  rejectSampleDelivery,
  submitSampleDelivery,
  updateSampleDelivery,
  updateSampleDeliveryTracking,
  withdrawSampleDelivery,
  type CurrentUser,
  type SampleDelivery,
  type SampleDeliveryFeeStatistics,
  type SampleDeliveryStatistics,
} from '@/api'
import { sampleDeliveryPath, moduleDetailPath } from '@/app/routes'
import { t } from '@/app/appI18n'
import { Metric } from '@/shared/ui'
import { showError } from '@/shared/errors'
import { downloadCsv } from '@/shared/print'
import {
  canApproveAssignedRecord,
  formatMoney,
  todayInputValue,
  type RoutedDetailPageProps,
} from '@/app/pages/appHelpers'
import {
  initialSampleDeliveryApproveForm,
  initialSampleDeliveryFeeStatistics,
  initialSampleDeliveryForm,
  initialSampleDeliveryRejectForm,
  initialSampleDeliveryStatistics,
  initialSampleDeliveryTrackingForm,
  sampleDeliveryApprovePayload,
  sampleDeliveryPayload,
  sampleDeliveryRejectPayload,
  sampleDeliveryToForm,
  sampleDeliveryTrackingPayload,
  type SampleDeliveryApproveFormState,
  type SampleDeliveryFormState,
  type SampleDeliveryRejectFormState,
  type SampleDeliveryTrackingFormState,
} from './sampleDeliveryHelpers'
import { SampleDeliveryDetailPanel } from './views/SampleDeliveryDetailPanel'
import { SampleDeliveryFormModal } from './views/SampleDeliveryFormModal'
import { SampleDeliveryListView } from './views/SampleDeliveryListView'
import { SampleDeliveryRejectModal } from './views/SampleDeliveryRejectModal'

type Props = RoutedDetailPageProps & { currentUser: CurrentUser }

export function SampleDeliveriesPage({ currentUser, detailId, onNavigate }: Props) {
  const [deliveries, setDeliveries] = useState<SampleDelivery[]>([])
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [expressFilter, setExpressFilter] = useState('')
  const [dateFromFilter, setDateFromFilter] = useState('')
  const [dateToFilter, setDateToFilter] = useState('')
  const [feeStatistics, setFeeStatistics] = useState<SampleDeliveryFeeStatistics>(() =>
    initialSampleDeliveryFeeStatistics(),
  )
  const [deliveryStatistics, setDeliveryStatistics] = useState<SampleDeliveryStatistics>(() =>
    initialSampleDeliveryStatistics(),
  )
  const [sampleHistory, setSampleHistory] = useState<SampleDelivery[]>([])
  const [quoteHistory, setQuoteHistory] = useState<SampleDelivery[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState<SampleDeliveryFormState>(() => initialSampleDeliveryForm())
  const [deliveryModalMode, setDeliveryModalMode] = useState<'create' | 'edit' | null>(null)
  const [reviewerId, setReviewerId] = useState('')
  const [approveForm, setApproveForm] = useState<SampleDeliveryApproveFormState>(() =>
    initialSampleDeliveryApproveForm(),
  )
  const [trackingForm, setTrackingForm] = useState<SampleDeliveryTrackingFormState>(() =>
    initialSampleDeliveryTrackingForm(),
  )
  const [rejectForm, setRejectForm] = useState<SampleDeliveryRejectFormState>(() =>
    initialSampleDeliveryRejectForm(),
  )
  const [rejectOpen, setRejectOpen] = useState(false)

  const selectedDelivery = useMemo(() => {
    if (detailId) return deliveries.find((item) => item.id === detailId) ?? null
    return deliveries.find((item) => item.id === selectedDeliveryId) ?? deliveries[0] ?? null
  }, [deliveries, detailId, selectedDeliveryId])

  useEffect(() => {
    void loadDeliveries()
  }, [])

  useEffect(() => {
    if (detailId && deliveries.length > 0 && !deliveries.some((item) => item.id === detailId)) {
      onNavigate(sampleDeliveryPath)
    }
  }, [deliveries, detailId, onNavigate])

  useEffect(() => {
    syncDeliveryActionForms(selectedDelivery)
    setReviewerId(selectedDelivery?.reviewer_id ?? '')
    setRejectForm(initialSampleDeliveryRejectForm(selectedDelivery?.delivery_date))
    setRejectOpen(false)
    void loadSelectedDeliveryHistories(selectedDelivery)
  }, [selectedDelivery?.id, selectedDelivery?.status, selectedDelivery?.tracking_no])

  async function loadDeliveries(preferredId?: string) {
    setLoading(true)
    try {
      const reportFilters = {
        customer_id: customerFilter.trim() || undefined,
        date_from: dateFromFilter || undefined,
        date_to: dateToFilter || undefined,
        express_company: expressFilter.trim() || undefined,
      }
      const [result, feeStats, deliveryStats] = await Promise.all([
        listSampleDeliveries({
          q: search.trim() || undefined,
          status: statusFilter || undefined,
          customer_id: customerFilter.trim() || undefined,
          express_company: expressFilter.trim() || undefined,
          date_from: dateFromFilter || undefined,
          date_to: dateToFilter || undefined,
        }),
        getSampleDeliveryFeeStatistics(reportFilters),
        getSampleDeliveryStatistics(reportFilters),
      ])
      setDeliveries(result.items)
      setFeeStatistics(feeStats)
      setDeliveryStatistics(deliveryStats)
      const nextSelectedId =
        preferredId ??
        (result.items.some((item) => item.id === selectedDeliveryId) ? selectedDeliveryId : null) ??
        result.items[0]?.id ??
        null
      setSelectedDeliveryId(nextSelectedId)
    } catch (caught) {
      showError(caught, t('sample.delivery.message.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function loadSelectedDeliveryHistories(delivery: SampleDelivery | null) {
    const line = delivery?.lines[0]
    if (!delivery || !line) {
      setSampleHistory([])
      setQuoteHistory([])
      return
    }
    try {
      const [sampleResult, quoteResult] = await Promise.all([
        getSampleDeliverySampleHistory(line.sample_record_id),
        getSampleDeliveryQuoteHistory({
          customer_id: delivery.customer_id ?? undefined,
          product_id: line.product_id ?? undefined,
        }),
      ])
      setSampleHistory(sampleResult.items)
      setQuoteHistory(quoteResult.items)
    } catch (caught) {
      showError(caught, t('sample.delivery.message.historyLoadFailed'))
    }
  }

  function syncDeliveryActionForms(delivery: SampleDelivery | null) {
    setApproveForm({
      reviewer_name: '',
      approved_at: delivery?.delivery_date ?? todayInputValue(),
    })
    setTrackingForm({
      express_company: delivery?.express_company ?? 'DHL',
      tracking_no: delivery?.tracking_no ?? '',
      status:
        delivery?.status === 'approved' || delivery?.status === 'shipped'
          ? 'shipped'
          : 'submitted',
    })
  }

  function upsertDelivery(delivery: SampleDelivery) {
    setDeliveries((current) => {
      const exists = current.some((item) => item.id === delivery.id)
      return exists
        ? current.map((item) => (item.id === delivery.id ? delivery : item))
        : [delivery, ...current]
    })
    setSelectedDeliveryId(delivery.id)
  }

  function openDeliveryDetail(delivery: SampleDelivery) {
    setSelectedDeliveryId(delivery.id)
    onNavigate(moduleDetailPath(sampleDeliveryPath, delivery.id))
  }

  function stopAndOpenDeliveryDetail(event: MouseEvent<HTMLElement>, delivery: SampleDelivery) {
    event.stopPropagation()
    openDeliveryDetail(delivery)
  }

  function openCreateDelivery() {
    setForm(initialSampleDeliveryForm())
    setDeliveryModalMode('create')
  }

  function openEditDelivery(delivery: SampleDelivery) {
    setForm(sampleDeliveryToForm(delivery))
    setDeliveryModalMode('edit')
  }

  async function submitDelivery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const created = await createSampleDelivery(sampleDeliveryPayload(form))
      setMessage(t('sample.delivery.message.created', { code: created.code }))
      setForm(initialSampleDeliveryForm())
      setDeliveryModalMode(null)
      upsertDelivery(created)
      await loadDeliveries(created.id)
      setDeliveries((current) =>
        current.some((delivery) => delivery.id === created.id) ? current : [created, ...current],
      )
      setSelectedDeliveryId(created.id)
    } catch (caught) {
      showError(caught, t('sample.delivery.message.createFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function saveDeliveryDraft() {
    if (!selectedDelivery) return
    setSubmitting(true)
    setMessage('')
    try {
      const updated = await updateSampleDelivery(selectedDelivery.id, sampleDeliveryPayload(form))
      setMessage(t('sample.delivery.message.draftSaved', { code: updated.code }))
      setDeliveryModalMode(null)
      upsertDelivery(updated)
      await loadDeliveries(updated.id)
    } catch (caught) {
      showError(caught, t('sample.delivery.message.draftSaveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function submitDeliveryForReview() {
    if (!selectedDelivery) return
    if (!reviewerId) {
      showError(new Error(t('sample.delivery.validation.reviewerRequired')))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const submitted = await submitSampleDelivery(selectedDelivery.id, { reviewer_id: reviewerId })
      setMessage(t('sample.delivery.message.submitted', { code: submitted.code }))
      upsertDelivery(submitted)
      await loadDeliveries(submitted.id)
    } catch (caught) {
      showError(caught, t('sample.delivery.message.submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function approveDelivery() {
    if (!selectedDelivery) return
    if (
      !canApproveAssignedRecord(
        currentUser,
        selectedDelivery.reviewer_id,
        'sample:delivery:approve',
      )
    ) {
      showError(
        new Error(
          t('sample.delivery.message.notReviewer', {
            reviewer:
              selectedDelivery.reviewer_name ?? t('sample.delivery.panel.designatedReviewer'),
          }),
        ),
      )
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const approved = await approveSampleDelivery(
        selectedDelivery.id,
        sampleDeliveryApprovePayload(approveForm),
      )
      setMessage(t('sample.delivery.message.approved', { code: approved.code }))
      upsertDelivery(approved)
      await loadDeliveries(approved.id)
    } catch (caught) {
      showError(caught, t('sample.delivery.message.approveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function rejectDelivery() {
    if (!selectedDelivery) return
    if (
      !canApproveAssignedRecord(
        currentUser,
        selectedDelivery.reviewer_id,
        'sample:delivery:approve',
      )
    ) {
      showError(
        new Error(
          t('sample.delivery.message.notReviewer', {
            reviewer:
              selectedDelivery.reviewer_name ?? t('sample.delivery.panel.designatedReviewer'),
          }),
        ),
      )
      return
    }
    if (!rejectForm.rejection_reason.trim()) {
      showError(new Error(t('sample.delivery.validation.rejectReasonRequired')))
      return
    }
    setSubmitting(true)
    setMessage('')
    try {
      const rejected = await rejectSampleDelivery(
        selectedDelivery.id,
        sampleDeliveryRejectPayload(rejectForm),
      )
      setMessage(t('sample.delivery.message.rejected', { code: rejected.code }))
      setRejectOpen(false)
      upsertDelivery(rejected)
      await loadDeliveries(rejected.id)
    } catch (caught) {
      showError(caught, t('sample.delivery.message.rejectFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function withdrawDelivery() {
    if (!selectedDelivery) return
    setSubmitting(true)
    setMessage('')
    try {
      const withdrawn = await withdrawSampleDelivery(selectedDelivery.id)
      setMessage(t('sample.delivery.message.withdrawn', { code: withdrawn.code }))
      upsertDelivery(withdrawn)
      await loadDeliveries(withdrawn.id)
    } catch (caught) {
      showError(caught, t('sample.delivery.message.withdrawFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function submitTracking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedDelivery) return
    setSubmitting(true)
    setMessage('')
    try {
      const tracked = await updateSampleDeliveryTracking(
        selectedDelivery.id,
        sampleDeliveryTrackingPayload(trackingForm),
      )
      setMessage(
        t('sample.delivery.message.trackingUpdated', {
          trackingNo: tracked.tracking_no ?? '',
        }).trim(),
      )
      upsertDelivery(tracked)
      await loadDeliveries(tracked.id)
    } catch (caught) {
      showError(caught, t('sample.delivery.message.trackingUpdateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function downloadDeliveryExport() {
    setSubmitting(true)
    setMessage('')
    try {
      const exported = await exportSampleDeliveries({
        customer_id: customerFilter.trim() || undefined,
        date_from: dateFromFilter || undefined,
        date_to: dateToFilter || undefined,
        express_company: expressFilter.trim() || undefined,
      })
      downloadCsv(exported.filename, exported.content)
      setMessage(t('sample.delivery.message.exported', { count: exported.total }))
    } catch (caught) {
      showError(caught, t('sample.delivery.message.exportFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="sample-delivery-page">
      <div className="summary-strip" aria-label={t('sample.delivery.pageAria')}>
        <Metric label={t('sample.delivery.metric.deliveryCount')} value={deliveries.length} />
        <Metric
          label={t('sample.delivery.metric.pendingCount')}
          value={deliveries.filter((item) => item.status === 'submitted').length}
        />
        <Metric
          label={t('sample.delivery.metric.approvedCount')}
          value={deliveries.filter((item) => ['approved', 'shipped'].includes(item.status)).length}
        />
        <Metric
          label={t('sample.delivery.metric.totalQuantity')}
          value={deliveryStatistics.total_quantity}
        />
        <Metric
          label={t('sample.delivery.metric.feeTotal')}
          value={formatMoney(feeStatistics.total_amount, feeStatistics.currency)}
        />
      </div>

      {message ? (
        <Alert className="workspace-alert" title={message} type="success" showIcon />
      ) : null}

      <section className="business-grid sample-delivery-grid">
        {!detailId ? (
          <SampleDeliveryListView
            deliveries={deliveries}
            loading={loading}
            selectedId={selectedDelivery?.id}
            submitting={submitting}
            search={search}
            statusFilter={statusFilter}
            customerFilter={customerFilter}
            expressFilter={expressFilter}
            dateFromFilter={dateFromFilter}
            dateToFilter={dateToFilter}
            onSearchChange={setSearch}
            onStatusChange={setStatusFilter}
            onCustomerChange={setCustomerFilter}
            onExpressChange={setExpressFilter}
            onDateFromChange={setDateFromFilter}
            onDateToChange={setDateToFilter}
            onQuery={() => void loadDeliveries()}
            onExport={() => void downloadDeliveryExport()}
            onCreate={openCreateDelivery}
            onOpenDetail={stopAndOpenDeliveryDetail}
            onSelect={setSelectedDeliveryId}
          />
        ) : null}

        <SampleDeliveryFormModal
          open={Boolean(deliveryModalMode)}
          mode={deliveryModalMode}
          form={form}
          submitting={submitting}
          onFormChange={setForm}
          onClose={() => setDeliveryModalMode(null)}
          onCreate={submitDelivery}
          onSaveDraft={() => void saveDeliveryDraft()}
        />

        <SampleDeliveryRejectModal
          form={rejectForm}
          open={rejectOpen}
          submitting={submitting}
          onCancel={() => setRejectOpen(false)}
          onConfirm={() => void rejectDelivery()}
          onFormChange={setRejectForm}
        />

        {detailId ? (
          <SampleDeliveryDetailPanel
            selectedDelivery={selectedDelivery}
            currentUser={currentUser}
            reviewerId={reviewerId}
            submitting={submitting}
            trackingForm={trackingForm}
            feeStatistics={feeStatistics}
            deliveryStatistics={deliveryStatistics}
            sampleHistory={sampleHistory}
            quoteHistory={quoteHistory}
            onBack={() => onNavigate(sampleDeliveryPath)}
            onEdit={openEditDelivery}
            onSubmitReview={submitDeliveryForReview}
            onApprove={approveDelivery}
            onWithdraw={withdrawDelivery}
            onOpenReject={() => setRejectOpen(true)}
            onSubmitTracking={submitTracking}
            onReviewerChange={setReviewerId}
            onTrackingFormChange={setTrackingForm}
          />
        ) : null}
      </section>
    </section>
  )
}
