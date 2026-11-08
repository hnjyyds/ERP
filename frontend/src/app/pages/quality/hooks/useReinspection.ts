import { useState } from 'react'
import type { FormEvent } from 'react'

import {
  createQualityReinspection,
  type CurrentUser,
  type QualityInspection,
  type QualityInspectionInboundEligibility,
} from '@/api'
import { showError, showWarningDialog } from '@/shared/errors'
import { t } from '@/app/appI18n'
import { moduleDetailPath, qualityInspectionPath } from '@/app/routes'

import { defaultScheduledAt } from '../qualityInspectionMeta'

type Options = {
  inspection: QualityInspection | null
  eligibility: QualityInspectionInboundEligibility | null
  currentUser: CurrentUser
  onNavigate: (path: string) => void
  onCreated: (inspection: QualityInspection) => void
  setMessage: (message: string) => void
}

export function useReinspection({
  inspection,
  eligibility,
  currentUser,
  onNavigate,
  onCreated,
  setMessage,
}: Options) {
  const [reinspectionOpen, setReinspectionOpen] = useState(false)
  const [reinspectionCode, setReinspectionCode] = useState('')
  const [reinspectionSchedule, setReinspectionSchedule] = useState(defaultScheduledAt())
  const [reinspectionReason, setReinspectionReason] = useState(() =>
    t('quality.inspection.modal.defaultReinspectionReason'),
  )
  const [submitting, setSubmitting] = useState(false)

  function openReinspection() {
    if (!inspection || eligibility?.latest_inspection_id !== inspection.id) {
      showWarningDialog(t('quality.inspection.message.reinspectionLatestOnly'))
      return
    }
    setReinspectionCode('')
    setReinspectionSchedule(defaultScheduledAt())
    setReinspectionReason(t('quality.inspection.modal.defaultReinspectionReason'))
    setReinspectionOpen(true)
  }

  function closeReinspection() {
    setReinspectionOpen(false)
  }

  async function submitReinspection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!inspection || !reinspectionReason.trim()) {
      showWarningDialog(t('quality.inspection.message.reinspectionRequired'))
      return
    }
    setSubmitting(true)
    try {
      const reinspection = await createQualityReinspection(inspection.id, {
        scheduled_at: reinspectionSchedule,
        inspector_id: inspection.inspector_id ?? currentUser.id,
        reason: reinspectionReason.trim(),
      })
      onCreated(reinspection)
      setReinspectionOpen(false)
      setMessage(t('quality.inspection.message.reinspectionCreated', { code: reinspection.code }))
      onNavigate(moduleDetailPath(qualityInspectionPath, reinspection.id))
    } catch (caught) {
      showError(caught, t('quality.inspection.message.reinspectionCreateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return {
    reinspectionOpen,
    reinspectionCode,
    reinspectionSchedule,
    setReinspectionSchedule,
    reinspectionReason,
    setReinspectionReason,
    submitting,
    openReinspection,
    closeReinspection,
    submitReinspection,
  }
}
