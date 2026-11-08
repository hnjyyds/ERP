import { Alert, Button, Input, Modal } from 'antd'

import { t } from '@/app/appI18n'

import type { useQualityTaskWorkflow } from '../hooks/useQualityTaskWorkflow'
import { RequiredLabel } from './QualityTaskFormFields'

type Props = {
  workflow: ReturnType<typeof useQualityTaskWorkflow>
}

export function QualityTaskActionModal({ workflow }: Props) {
  const actionTask = workflow.actionTask
  const actionMode = workflow.actionMode

  return (
    <Modal
      centered
      footer={null}
      open={Boolean(actionTask && actionMode)}
      title={
        actionMode === 'cancel'
          ? t('quality.task.modal.cancelTitle')
          : t('quality.task.modal.rescheduleTitle')
      }
      width={560}
      onCancel={workflow.closeTaskAction}
    >
      {actionTask && actionMode ? (
        <form className="record-form" onSubmit={workflow.submitTaskAction}>
          <Alert
            showIcon
            title={`${actionTask.code} / ${actionTask.purchase_contract_no}`}
            type={actionMode === 'cancel' ? 'warning' : 'info'}
          />
          {actionMode === 'reschedule' ? (
            <label htmlFor="quality-action-schedule">
              <RequiredLabel>{t('quality.task.field.newSchedule')}</RequiredLabel>
              <Input
                id="quality-action-schedule"
                required
                type="datetime-local"
                value={workflow.actionSchedule}
                onChange={(event) => workflow.setActionSchedule(event.target.value)}
              />
            </label>
          ) : null}
          <label htmlFor="quality-action-reason">
            <RequiredLabel>
              {actionMode === 'cancel'
                ? t('quality.task.field.cancelReason')
                : t('quality.task.field.rescheduleReason')}
            </RequiredLabel>
            <Input.TextArea
              id="quality-action-reason"
              required
              rows={3}
              value={workflow.actionReason}
              onChange={(event) => workflow.setActionReason(event.target.value)}
            />
          </label>
          <Button
            danger={actionMode === 'cancel'}
            htmlType="submit"
            loading={workflow.submittingId === actionTask.id}
            type="primary"
          >
            {actionMode === 'cancel'
              ? t('quality.task.action.confirmCancel')
              : t('quality.task.action.saveSchedule')}
          </Button>
        </form>
      ) : null}
    </Modal>
  )
}
