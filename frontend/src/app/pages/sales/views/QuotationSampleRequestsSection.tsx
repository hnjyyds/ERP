import { Button, Input, Modal, Table } from 'antd'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

import {
  createSampleRequestFromQuotation,
  getQuotationSampleRequests,
  type ExportQuotation,
  type QuotationSampleRequest,
} from '@/api'
import { t } from '@/app/appI18n'
import { emptyToNull, formatDate, todayInputValue } from '@/app/pages/appHelpers'
import {
  sampleProgressStageLabel,
  sampleStatusLabel,
} from '@/app/pages/sample/sampleRequestHelpers'
import { showError, showSuccess } from '@/shared/errors'
import { FormSelect } from '@/shared/ui'
import { sampleDestinationOptions } from '@/shared/formOptions'

type Props = {
  quotation: ExportQuotation | null
}

type FormState = {
  request_date: string
  due_date: string
  destination: string
  requirements: string
  quantity: string
  unit: string
}

function initialForm(quotation: ExportQuotation | null): FormState {
  return {
    request_date: todayInputValue(),
    due_date: '',
    destination: 'in_house',
    requirements: '',
    quantity: '1',
    unit: quotation?.lines[0]?.unit ?? 'pcs',
  }
}

export function QuotationSampleRequestsSection({ quotation }: Props) {
  const [items, setItems] = useState<QuotationSampleRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<FormState>(() => initialForm(quotation))

  useEffect(() => {
    setItems([])
    if (!quotation) return
    let cancelled = false
    setLoading(true)
    getQuotationSampleRequests(quotation.id)
      .then((result) => {
        if (!cancelled) setItems(result.items)
      })
      .catch((caught) => {
        if (!cancelled) showError(caught, t('app.message.loadFailed'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [quotation])

  function openModal() {
    setForm(initialForm(quotation))
    setModalOpen(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!quotation) return
    const firstLine = quotation.lines[0]
    setSubmitting(true)
    try {
      await createSampleRequestFromQuotation(quotation.id, {
        request_date: form.request_date,
        quotation_id: quotation.id,
        quotation_no: quotation.code,
        customer_id: quotation.customer_id,
        customer_name: quotation.customer_name,
        product_id: firstLine?.product_id ?? null,
        product_code: firstLine?.product_code ?? null,
        product_name: firstLine?.product_name ?? null,
        destination: form.destination,
        requirements: form.requirements,
        due_date: emptyToNull(form.due_date),
        status: 'draft',
        lines: firstLine
          ? [
              {
                product_id: firstLine.product_id,
                product_code: firstLine.product_code,
                product_name: firstLine.product_name,
                specification: firstLine.specification,
                quantity: form.quantity,
                unit: form.unit,
                requirement: emptyToNull(form.requirements),
              },
            ]
          : [],
      })
      setModalOpen(false)
      showSuccess(t('sales.quotation.detail.sampleRequestCreated'))
      const result = await getQuotationSampleRequests(quotation.id)
      setItems(result.items)
    } catch (caught) {
      showError(caught, t('common.error.actionFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="accessory-heading">
        <strong>{t('sales.quotation.detail.sampleRequestTitle')}</strong>
        <Button size="small" onClick={openModal}>
          {t('sales.quotation.action.createSampleRequest')}
        </Button>
      </div>
      <Table<QuotationSampleRequest>
        columns={[
          { title: t('sales.quotation.field.sampleRequestNo'), dataIndex: 'code' },
          {
            title: t('sales.quotation.field.status'),
            dataIndex: 'status',
            render: sampleStatusLabel,
          },
          {
            title: t('sales.quotation.field.latestProgress'),
            key: 'latest_progress',
            render: (_, item) =>
              item.latest_progress
                ? `${sampleProgressStageLabel(item.latest_progress.stage)} / ${sampleStatusLabel(
                    item.latest_progress.status,
                  )}`
                : t('sales.quotation.detail.notFilled'),
          },
          {
            title: t('sales.quotation.field.sampleRecord'),
            dataIndex: 'sample_record_code',
            render: (value: string | null) =>
              value ?? t('sales.quotation.detail.notConverted'),
          },
          {
            title: t('sales.quotation.field.date'),
            dataIndex: 'request_date',
            render: formatDate,
          },
        ]}
        dataSource={items}
        loading={loading}
        locale={{ emptyText: t('sales.quotation.detail.noSampleRequests') }}
        pagination={false}
        rowKey="id"
        size="small"
      />
      <Modal
        centered
        footer={null}
        open={modalOpen}
        title={t('sales.quotation.detail.sampleRequestFormTitle')}
        onCancel={() => setModalOpen(false)}
      >
        <form className="record-form entity-modal-form" onSubmit={submit}>
          <label>
            {t('sample.request.field.requestDate')}
            <Input
              required
              type="date"
              value={form.request_date}
              onChange={(event) => setForm({ ...form, request_date: event.target.value })}
            />
          </label>
          <label>
            {t('sample.request.field.dueDate')}
            <Input
              type="date"
              value={form.due_date}
              onChange={(event) => setForm({ ...form, due_date: event.target.value })}
            />
          </label>
          <label htmlFor="quotation-sample-request-destination">
            {t('sample.request.field.destination')}
            <FormSelect
              id="quotation-sample-request-destination"
              value={form.destination}
              onChange={(event) => setForm({ ...form, destination: event.target.value })}
            >
              {sampleDestinationOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(item.labelKey)}
                </option>
              ))}
            </FormSelect>
          </label>
          <label>
            {t('sample.request.field.quantity')}
            <Input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.quantity}
              onChange={(event) => setForm({ ...form, quantity: event.target.value })}
            />
          </label>
          <label>
            {t('sample.request.field.unit')}
            <Input
              required
              value={form.unit}
              onChange={(event) => setForm({ ...form, unit: event.target.value })}
            />
          </label>
          <label>
            {t('sample.request.field.requirements')}
            <Input.TextArea
              required
              rows={4}
              value={form.requirements}
              onChange={(event) => setForm({ ...form, requirements: event.target.value })}
            />
          </label>
          <div className="modal-actions">
            <button className="secondary-inline" type="button" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </button>
            <button className="inline-submit" disabled={submitting} type="submit">
              {t('sales.quotation.action.createSampleRequest')}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
