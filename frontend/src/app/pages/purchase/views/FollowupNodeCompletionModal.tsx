import { Alert, Button, Input, Modal } from 'antd'

import { t } from '@/app/appI18n'
import type { PurchaseFollowPlan } from '@/api'

import { followupNodeLabel } from '../followupHelpers'
import type { useFollowupActions } from '../hooks/useFollowupActions'

type Props = {
  model: ReturnType<typeof useFollowupActions>
  plan: PurchaseFollowPlan | null
}

export function FollowupNodeCompletionModal({ model, plan }: Props) {
  return (
    <Modal
      centered
      footer={null}
      open={Boolean(model.nodeActionNode)}
      title={
        model.nodeActionNode
          ? t('purchase.followup.form.registerTitle', {
              name: followupNodeLabel(
                model.nodeActionNode.node_code,
                model.nodeActionNode.node_name,
              ),
            })
          : t('purchase.followup.form.registerFallbackTitle')
      }
      width={600}
      onCancel={() => model.setNodeActionNode(null)}
    >
      {model.nodeActionNode && plan ? (
        <form
          className="record-form followup-node-completion-form"
          onSubmit={model.completeNodeFromForm}
        >
          <Alert
            description={t('purchase.followup.form.registerHint', {
              name: followupNodeLabel(
                model.nodeActionNode.node_code,
                model.nodeActionNode.node_name,
              ),
            })}
            title={`${plan.purchase_contract_no} · ${plan.supplier_name}`}
            type="info"
            showIcon
          />
          <div className="form-pair two">
            <label htmlFor="followup-node-actual-date">
              {t('purchase.followup.field.actualCompletionDate')}
              <Input
                id="followup-node-actual-date"
                required
                type="date"
                value={model.nodeCompletionForm.actual_date}
                onChange={(event) =>
                  model.setNodeCompletionForm({
                    ...model.nodeCompletionForm,
                    actual_date: event.target.value,
                  })
                }
              />
            </label>
            <label htmlFor="followup-node-source-id">
              {t('purchase.followup.field.businessRecordNo')}
              <Input
                id="followup-node-source-id"
                maxLength={36}
                placeholder={t('purchase.followup.form.businessRecordNoPlaceholder')}
                required
                value={model.nodeCompletionForm.source_record_id}
                onChange={(event) =>
                  model.setNodeCompletionForm({
                    ...model.nodeCompletionForm,
                    source_record_id: event.target.value,
                  })
                }
              />
            </label>
          </div>
          <label htmlFor="followup-node-summary">
            {t('purchase.followup.field.handleNote')}
            <Input.TextArea
              id="followup-node-summary"
              maxLength={240}
              placeholder={t('purchase.followup.form.handleNotePlaceholder')}
              required
              rows={3}
              value={model.nodeCompletionForm.source_summary}
              onChange={(event) =>
                model.setNodeCompletionForm({
                  ...model.nodeCompletionForm,
                  source_summary: event.target.value,
                })
              }
            />
          </label>
          <div className="modal-actions split">
            <Button htmlType="button" onClick={() => model.setNodeActionNode(null)}>
              {t('common.cancel')}
            </Button>
            <Button htmlType="submit" loading={model.submitting} type="primary">
              {t('purchase.followup.action.saveAndCompleteNode')}
            </Button>
          </div>
        </form>
      ) : null}
    </Modal>
  )
}
