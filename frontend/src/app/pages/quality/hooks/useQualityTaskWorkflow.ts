import type { ChangeEvent, FormEvent } from 'react'
import { useState } from 'react'

import {
  cancelQualityInspection,
  listPurchaseContracts,
  rescheduleQualityInspection,
  updateQualityInspection,
  uploadImage,
  type QualityInspection,
} from '@/api'
import { showError, showWarningDialog } from '@/shared/errors'
import { t } from '@/app/appI18n'

import {
  basePayload,
  completionPayload,
  initialCompletionForm,
  readFileAsDataUrl,
  resultLabel,
  validateCompletion,
  type CompletionErrors,
  type CompletionFormState,
  type CompletionIssueState,
  type CompletionLineState,
} from '../qualityTaskHelpers'

type Params = {
  reloadTasks: () => Promise<void>
  upsertTask: (task: QualityInspection) => void
}

export function useQualityTaskWorkflow({ reloadTasks, upsertTask }: Params) {
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [completionTask, setCompletionTask] = useState<QualityInspection | null>(null)
  const [completionForm, setCompletionForm] = useState<CompletionFormState | null>(null)
  const [completionErrors, setCompletionErrors] = useState<CompletionErrors>({})
  const [actionTask, setActionTask] = useState<QualityInspection | null>(null)
  const [actionMode, setActionMode] = useState<'reschedule' | 'cancel' | null>(null)
  const [actionReason, setActionReason] = useState('')
  const [actionSchedule, setActionSchedule] = useState('')
  const [uploadingEvidence, setUploadingEvidence] = useState(false)

  async function startTask(task: QualityInspection) {
    setSubmittingId(task.id)
    setMessage('')
    try {
      await updateQualityInspection(task.id, basePayload(task, 'in_progress'))
      setMessage(t('quality.task.message.started', { code: task.code }))
      await reloadTasks()
    } catch (caught) {
      showError(caught, t('quality.task.message.statusUpdateFailed'))
    } finally {
      setSubmittingId(null)
    }
  }

  async function openCompletion(task: QualityInspection) {
    setCompletionTask(task)
    setCompletionForm(initialCompletionForm(task))
    setCompletionErrors({})
    try {
      const result = await listPurchaseContracts({ q: task.purchase_contract_no })
      const contract = result.items.find((item) => item.id === task.purchase_contract_id)
      if (!contract?.lines.length) return
      setCompletionForm((current) =>
        current
          ? {
              ...current,
              lines: contract.lines.map((line) => ({
                purchase_contract_line_id: line.id,
                product_id: line.product_id ?? '',
                product_code: line.product_code ?? '',
                product_name: line.product_name,
                inspected_quantity: line.quantity,
                failed_quantity: '0',
                unit: line.unit,
                result: current.result,
                remark: '',
              })),
              issue: {
                ...current.issue,
                purchase_contract_line_id: contract.lines[0].id,
              },
            }
          : current,
      )
    } catch (caught) {
      showError(caught, t('quality.task.message.contractLinesLoadFailed'))
    }
  }

  function closeCompletion() {
    setCompletionTask(null)
    setCompletionForm(null)
    setCompletionErrors({})
  }

  function updateCompletionField(field: 'inspected_at' | 'result', value: string) {
    setCompletionForm((current) => (current ? { ...current, [field]: value } : current))
    setCompletionErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  function changeCompletionResult(value: string) {
    updateCompletionField('result', value)
    setCompletionForm((current) =>
      current
        ? {
            ...current,
            lines: current.lines.map((line) => ({
              ...line,
              result: value,
              failed_quantity: value === 'passed' ? '0' : line.failed_quantity,
            })),
          }
        : current,
    )
  }

  function updateCompletionLine(index: number, field: keyof CompletionLineState, value: string) {
    setCompletionForm((current) => {
      if (!current) return current
      const lines = current.lines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [field]: value } : line,
      )
      return { ...current, lines }
    })
    setCompletionErrors((current) => {
      const key = `line-${index}-${field}`
      if (!current[key]) return current
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function updateIssueField(field: keyof CompletionIssueState, value: string) {
    setCompletionForm((current) =>
      current ? { ...current, issue: { ...current.issue, [field]: value } } : current,
    )
    if (field !== 'description') return
    setCompletionErrors((current) => {
      if (!current.issue_description) return current
      const next = { ...current }
      delete next.issue_description
      return next
    })
  }

  async function handleEvidenceUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showWarningDialog(t('quality.task.message.evidenceImageOnly'))
      return
    }
    setUploadingEvidence(true)
    try {
      const uploaded = await uploadImage(file.name, await readFileAsDataUrl(file))
      setCompletionForm((current) =>
        current
          ? {
              ...current,
              attachments: [
                ...current.attachments,
                { filename: uploaded.filename, url: uploaded.url, category: 'inspection' },
              ],
            }
          : current,
      )
    } catch (caught) {
      showError(caught, t('quality.task.message.evidenceUploadFailed'))
    } finally {
      setUploadingEvidence(false)
    }
  }

  async function submitCompletion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!completionTask || !completionForm) return
    const errors = validateCompletion(completionForm)
    if (Object.keys(errors).length > 0) {
      setCompletionErrors(errors)
      showWarningDialog(
        t('quality.task.message.validationSummary', { count: Object.keys(errors).length }),
      )
      return
    }
    setSubmittingId(completionTask.id)
    try {
      const updated = await updateQualityInspection(
        completionTask.id,
        completionPayload(completionTask, completionForm),
      )
      upsertTask(updated)
      setCompletionTask(null)
      setCompletionForm(null)
      await reloadTasks()
      setMessage(
        t('quality.task.message.completed', {
          code: updated.code,
          result: resultLabel(updated.result),
        }),
      )
    } catch (caught) {
      showError(caught, t('quality.task.message.completionSaveFailed'))
    } finally {
      setSubmittingId(null)
    }
  }

  function openTaskAction(task: QualityInspection, mode: 'reschedule' | 'cancel') {
    setActionTask(task)
    setActionMode(mode)
    setActionReason('')
    setActionSchedule(task.scheduled_at.slice(0, 16))
  }

  function closeTaskAction() {
    setActionTask(null)
    setActionMode(null)
  }

  async function submitTaskAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!actionTask || !actionMode || !actionReason.trim()) {
      showWarningDialog(
        actionMode === 'cancel'
          ? t('quality.task.message.cancelReasonRequired')
          : t('quality.task.message.rescheduleReasonRequired'),
      )
      return
    }
    setSubmittingId(actionTask.id)
    try {
      const updated =
        actionMode === 'cancel'
          ? await cancelQualityInspection(actionTask.id, actionReason.trim())
          : await rescheduleQualityInspection(actionTask.id, {
              scheduled_at: actionSchedule,
              reason: actionReason.trim(),
            })
      upsertTask(updated)
      setMessage(
        actionMode === 'cancel'
          ? t('quality.task.message.cancelled', { code: updated.code })
          : t('quality.task.message.rescheduled', { code: updated.code }),
      )
      setActionTask(null)
      setActionMode(null)
      await reloadTasks()
    } catch (caught) {
      showError(
        caught,
        actionMode === 'cancel'
          ? t('quality.task.message.cancelFailed')
          : t('quality.task.message.rescheduleFailed'),
      )
    } finally {
      setSubmittingId(null)
    }
  }

  return {
    submittingId,
    message,
    completionTask,
    completionForm,
    completionErrors,
    actionTask,
    actionMode,
    actionReason,
    setActionReason,
    actionSchedule,
    setActionSchedule,
    uploadingEvidence,
    startTask,
    openCompletion,
    closeCompletion,
    updateCompletionField,
    changeCompletionResult,
    updateCompletionLine,
    updateIssueField,
    handleEvidenceUpload,
    submitCompletion,
    openTaskAction,
    closeTaskAction,
    submitTaskAction,
  }
}
