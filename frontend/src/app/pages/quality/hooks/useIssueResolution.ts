import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import { resolveQualityIssue, uploadImage, type QualityInspection } from '@/api'
import { showError, showWarningDialog } from '@/shared/errors'
import { t } from '@/app/appI18n'

type ResolutionAttachment = { filename: string; url: string; category: 'resolution' }

type Options = {
  inspection: QualityInspection | null
  onUpdated: (updated: QualityInspection) => void
  onIssueResolved: () => void
  setMessage: (message: string) => void
}

export function useIssueResolution({
  inspection,
  onUpdated,
  onIssueResolved,
  setMessage,
}: Options) {
  const [resolvingIssueId, setResolvingIssueId] = useState<string | null>(null)
  const [resolutionNote, setResolutionNote] = useState('')
  const [resolutionAttachments, setResolutionAttachments] = useState<ResolutionAttachment[]>([])
  const [uploadingEvidence, setUploadingEvidence] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function openIssueResolution(issueId: string) {
    setResolvingIssueId(issueId)
    setResolutionNote('')
    setResolutionAttachments([])
  }

  function closeIssueResolution() {
    setResolvingIssueId(null)
  }

  async function uploadResolutionEvidence(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showWarningDialog(t('quality.inspection.message.evidenceImageOnly'))
      return
    }
    setUploadingEvidence(true)
    try {
      const uploaded = await uploadImage(file.name, await readFileAsDataUrl(file))
      setResolutionAttachments((current) => [
        ...current,
        { filename: uploaded.filename, url: uploaded.url, category: 'resolution' },
      ])
    } catch (caught) {
      showError(caught, t('quality.inspection.message.evidenceUploadFailed'))
    } finally {
      setUploadingEvidence(false)
    }
  }

  async function submitIssueResolution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!inspection || !resolvingIssueId || !resolutionNote.trim()) {
      showWarningDialog(t('quality.inspection.message.resolutionNoteRequired'))
      return
    }
    setSubmitting(true)
    try {
      const updated = await resolveQualityIssue(inspection.id, resolvingIssueId, {
        resolution_note: resolutionNote.trim(),
        attachments: resolutionAttachments,
      })
      onUpdated(updated)
      onIssueResolved()
      setResolvingIssueId(null)
      setMessage(t('quality.inspection.message.issueResolved'))
    } catch (caught) {
      showError(caught, t('quality.inspection.message.issueResolveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return {
    resolvingIssueId,
    resolutionNote,
    setResolutionNote,
    resolutionAttachments,
    uploadingEvidence,
    submitting,
    openIssueResolution,
    closeIssueResolution,
    uploadResolutionEvidence,
    submitIssueResolution,
  }
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () =>
      reject(reader.error ?? new Error(t('quality.inspection.message.fileReadFailed')))
    reader.readAsDataURL(file)
  })
}
