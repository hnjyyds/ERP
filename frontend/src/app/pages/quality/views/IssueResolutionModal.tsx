import { Alert, Button, Input, Modal } from 'antd'
import { Paperclip } from 'lucide-react'

import { t } from '@/app/appI18n'

import type { useIssueResolution } from '../hooks/useIssueResolution'
import { RequiredFieldLabel } from './QualityFormFields'

type Props = {
  model: ReturnType<typeof useIssueResolution>
}

export function IssueResolutionModal({ model }: Props) {
  return (
    <Modal
      centered
      footer={null}
      open={Boolean(model.resolvingIssueId)}
      title={t('quality.inspection.modal.resolveTitle')}
      width={620}
      onCancel={model.closeIssueResolution}
    >
      <form className="record-form" onSubmit={model.submitIssueResolution}>
        <Alert showIcon title={t('quality.inspection.modal.resolveNotice')} type="warning" />
        <label htmlFor="quality-resolution-note">
          <RequiredFieldLabel>{t('quality.inspection.field.resolutionNote')}</RequiredFieldLabel>
          <Input.TextArea
            id="quality-resolution-note"
            required
            rows={4}
            value={model.resolutionNote}
            onChange={(event) => model.setResolutionNote(event.target.value)}
          />
        </label>
        <label className="quality-file-upload" htmlFor="quality-resolution-evidence">
          {t('quality.inspection.modal.evidenceLabel')}
          <input
            accept="image/*"
            aria-label={t('quality.inspection.modal.evidenceAria')}
            id="quality-resolution-evidence"
            type="file"
            onChange={(event) => void model.uploadResolutionEvidence(event)}
          />
        </label>
        <div className="quality-attachment-list">
          {model.resolutionAttachments.map((attachment) => (
            <a href={attachment.url} key={attachment.url} rel="noreferrer" target="_blank">
              <Paperclip size={14} />
              {attachment.filename}
            </a>
          ))}
          {model.uploadingEvidence ? (
            <span>{t('quality.inspection.modal.uploadingEvidence')}</span>
          ) : null}
        </div>
        <Button htmlType="submit" loading={model.submitting} type="primary">
          {t('quality.inspection.modal.submitResolve')}
        </Button>
      </form>
    </Modal>
  )
}
