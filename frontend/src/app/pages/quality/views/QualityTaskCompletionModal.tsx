import { Alert, Button, Input, Modal } from 'antd'
import { Paperclip } from 'lucide-react'

import { t } from '@/app/appI18n'
import { FormSelect } from '@/shared/ui'

import {
  formatScheduledAt,
  qualityIssueSeverityOptions,
  qualityResultOptions,
} from '../qualityTaskHelpers'
import type { useQualityTaskWorkflow } from '../hooks/useQualityTaskWorkflow'
import { CompletionError, RequiredLabel } from './QualityTaskFormFields'

type Props = {
  workflow: ReturnType<typeof useQualityTaskWorkflow>
}

export function QualityTaskCompletionModal({ workflow }: Props) {
  const completionTask = workflow.completionTask
  const completionForm = workflow.completionForm
  const completionErrors = workflow.completionErrors

  return (
    <Modal
      centered
      footer={null}
      open={Boolean(completionTask && completionForm)}
      title={
        completionTask
          ? t('quality.task.modal.completionTitleWithCode', { code: completionTask.code })
          : t('quality.task.modal.completionTitle')
      }
      width={920}
      onCancel={workflow.closeCompletion}
    >
      {completionTask && completionForm ? (
        <div className="workflow-modal-content entity-modal-form">
          <Alert
            showIcon
            title={t('quality.task.modal.scheduleSummary', {
              schedule: formatScheduledAt(completionTask.scheduled_at),
            })}
            description={`${completionTask.purchase_contract_no} / ${completionTask.supplier_name}`}
            type="info"
          />
          <form className="record-form" noValidate onSubmit={workflow.submitCompletion}>
            <div className="form-divider">{t('quality.task.modal.resultSection')}</div>
            <div className="form-pair two">
              <label htmlFor="quality-task-inspected-at">
                <RequiredLabel>{t('quality.task.field.inspectedAt')}</RequiredLabel>
                <Input
                  aria-invalid={Boolean(completionErrors.inspected_at)}
                  id="quality-task-inspected-at"
                  required
                  status={completionErrors.inspected_at ? 'error' : undefined}
                  type="date"
                  value={completionForm.inspected_at}
                  onChange={(event) =>
                    workflow.updateCompletionField('inspected_at', event.target.value)
                  }
                />
                <CompletionError field="inspected_at" errors={completionErrors} />
              </label>
              <label htmlFor="quality-task-result">
                <RequiredLabel>{t('quality.task.field.result')}</RequiredLabel>
                <FormSelect
                  aria-invalid={Boolean(completionErrors.result)}
                  id="quality-task-result"
                  required
                  status={completionErrors.result ? 'error' : undefined}
                  value={completionForm.result}
                  onChange={(event) => workflow.changeCompletionResult(event.target.value)}
                >
                  {qualityResultOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </FormSelect>
                <CompletionError field="result" errors={completionErrors} />
              </label>
            </div>

            <div className="form-divider">{t('quality.task.modal.linesSection')}</div>
            {completionErrors.lines ? (
              <Alert showIcon title={completionErrors.lines} type="error" />
            ) : null}
            <div className="quality-line-editor-list">
              {completionForm.lines.map((line, index) => {
                const prefix = `line-${index}`
                return (
                  <section className="quality-line-editor" key={line.purchase_contract_line_id || index}>
                    <div className="accessory-heading">
                      <strong>
                        {line.product_code ||
                          t('quality.task.modal.lineFallback', { index: index + 1 })}
                      </strong>
                      <span>{t('quality.task.modal.contractLine', { index: index + 1 })}</span>
                    </div>
                    <label htmlFor={`${prefix}-product-name`}>
                      <RequiredLabel>{t('quality.task.field.productName')}</RequiredLabel>
                      <Input id={`${prefix}-product-name`} readOnly value={line.product_name} />
                    </label>
                    <div className="form-pair three">
                      <label htmlFor={`${prefix}-inspected-quantity`}>
                        <RequiredLabel>{t('quality.task.field.inspectedQuantity')}</RequiredLabel>
                        <Input
                          id={`${prefix}-inspected-quantity`}
                          min="0.0001"
                          step="0.0001"
                          type="number"
                          value={line.inspected_quantity}
                          onChange={(event) =>
                            workflow.updateCompletionLine(
                              index,
                              'inspected_quantity',
                              event.target.value,
                            )
                          }
                        />
                        <CompletionError
                          field={`${prefix}-inspected_quantity`}
                          errors={completionErrors}
                        />
                      </label>
                      <label htmlFor={`${prefix}-failed-quantity`}>
                        {t('quality.task.field.failedQuantity')}
                        <Input
                          id={`${prefix}-failed-quantity`}
                          min="0"
                          step="0.0001"
                          type="number"
                          value={line.failed_quantity}
                          onChange={(event) =>
                            workflow.updateCompletionLine(
                              index,
                              'failed_quantity',
                              event.target.value,
                            )
                          }
                        />
                        <CompletionError
                          field={`${prefix}-failed_quantity`}
                          errors={completionErrors}
                        />
                      </label>
                      <label htmlFor={`${prefix}-unit`}>
                        <RequiredLabel>{t('quality.task.field.unit')}</RequiredLabel>
                        <Input id={`${prefix}-unit`} readOnly value={line.unit} />
                      </label>
                    </div>
                    <div className="form-pair two">
                      <label htmlFor={`${prefix}-result`}>
                        <RequiredLabel>{t('quality.task.field.lineResult')}</RequiredLabel>
                        <FormSelect
                          id={`${prefix}-result`}
                          value={line.result}
                          onChange={(event) =>
                            workflow.updateCompletionLine(index, 'result', event.target.value)
                          }
                        >
                          {qualityResultOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {t(option.labelKey)}
                            </option>
                          ))}
                        </FormSelect>
                        <CompletionError field={`${prefix}-result`} errors={completionErrors} />
                      </label>
                      <label htmlFor={`${prefix}-remark`}>
                        {t('quality.task.field.lineRemark')}
                        <Input
                          id={`${prefix}-remark`}
                          value={line.remark}
                          onChange={(event) =>
                            workflow.updateCompletionLine(index, 'remark', event.target.value)
                          }
                        />
                      </label>
                    </div>
                  </section>
                )
              })}
            </div>

            <div className="form-divider">{t('quality.task.modal.issuesSection')}</div>
            {completionForm.result === 'passed' ? (
              <Alert showIcon title={t('quality.task.modal.passedNoIssue')} type="info" />
            ) : null}
            <div className="form-pair two">
              <label htmlFor="quality-task-issue-line">
                {t('quality.task.field.issueLine')}
                <FormSelect
                  id="quality-task-issue-line"
                  value={completionForm.issue.purchase_contract_line_id}
                  onChange={(event) =>
                    workflow.updateIssueField('purchase_contract_line_id', event.target.value)
                  }
                >
                  {completionForm.lines.map((line) => (
                    <option
                      key={line.purchase_contract_line_id}
                      value={line.purchase_contract_line_id}
                    >
                      {line.product_code || line.product_name}
                    </option>
                  ))}
                </FormSelect>
              </label>
              <label htmlFor="quality-task-issue-type">
                {t('quality.task.field.issueType')}
                <Input
                  id="quality-task-issue-type"
                  value={completionForm.issue.issue_type}
                  onChange={(event) => workflow.updateIssueField('issue_type', event.target.value)}
                />
              </label>
            </div>
            <div className="form-pair two">
              <label htmlFor="quality-task-severity">
                {t('quality.task.field.severity')}
                <FormSelect
                  id="quality-task-severity"
                  value={completionForm.issue.severity}
                  onChange={(event) => workflow.updateIssueField('severity', event.target.value)}
                >
                  {qualityIssueSeverityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </FormSelect>
              </label>
            </div>
            <label htmlFor="quality-task-description">
              {completionForm.result === 'passed' ? (
                t('quality.task.field.issueDescription')
              ) : (
                <RequiredLabel>{t('quality.task.field.issueDescription')}</RequiredLabel>
              )}
              <Input.TextArea
                disabled={completionForm.result === 'passed'}
                id="quality-task-description"
                rows={2}
                status={completionErrors.issue_description ? 'error' : undefined}
                value={completionForm.issue.description}
                onChange={(event) => workflow.updateIssueField('description', event.target.value)}
              />
              <CompletionError field="issue_description" errors={completionErrors} />
            </label>
            <label htmlFor="quality-task-corrective-action">
              {t('quality.task.field.correctiveAction')}
              <Input
                disabled={completionForm.result === 'passed'}
                id="quality-task-corrective-action"
                value={completionForm.issue.corrective_action}
                onChange={(event) =>
                  workflow.updateIssueField('corrective_action', event.target.value)
                }
              />
            </label>

            <div className="form-divider">{t('quality.task.modal.evidenceSection')}</div>
            <label className="quality-file-upload" htmlFor="quality-task-evidence">
              {t('quality.task.field.evidence')}
              <input
                accept="image/*"
                aria-label={t('quality.task.field.uploadEvidenceAria')}
                id="quality-task-evidence"
                type="file"
                onChange={(event) => void workflow.handleEvidenceUpload(event)}
              />
            </label>
            <div className="quality-attachment-list">
              {completionForm.attachments.map((attachment) => (
                <a href={attachment.url} key={attachment.url} rel="noreferrer" target="_blank">
                  <Paperclip size={14} />
                  {attachment.filename}
                </a>
              ))}
              {workflow.uploadingEvidence ? (
                <span>{t('quality.task.modal.uploadingEvidence')}</span>
              ) : null}
            </div>

            <Button
              htmlType="submit"
              loading={workflow.submittingId === completionTask.id}
              type="primary"
            >
              {t('quality.task.action.submitCompletion')}
            </Button>
          </form>
        </div>
      ) : null}
    </Modal>
  )
}
