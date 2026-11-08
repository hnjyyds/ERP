import { Button, Input, Modal, Segmented } from 'antd'
import { LayoutDashboard } from 'lucide-react'

import { followupNodeOptions, followupSourceTypeOptions } from '@/shared/formOptions'
import { FormSelect, PanelTitle } from '@/shared/ui'
import { t } from '@/app/appI18n'

import { followupSourceTypeForNode, type FollowupTemplateFormState } from '../followupHelpers'
import type { useFollowupActions } from '../hooks/useFollowupActions'

type Props = {
  model: ReturnType<typeof useFollowupActions>
}

function FollowupTemplateNodeFields({
  daysKey,
  label,
  remindKey,
  remindLabel,
  setTemplateForm,
  templateForm,
}: {
  daysKey: keyof FollowupTemplateFormState
  label: string
  remindKey: keyof FollowupTemplateFormState
  remindLabel: string
  setTemplateForm: (form: FollowupTemplateFormState) => void
  templateForm: FollowupTemplateFormState
}) {
  return (
    <div className="form-pair two">
      <label>
        {label}
        <Input
          type="number"
          min="0"
          value={templateForm[daysKey] as string}
          onChange={(event) => setTemplateForm({ ...templateForm, [daysKey]: event.target.value })}
        />
      </label>
      <label>
        {remindLabel}
        <Input
          type="number"
          min="0"
          value={templateForm[remindKey] as string}
          onChange={(event) =>
            setTemplateForm({ ...templateForm, [remindKey]: event.target.value })
          }
        />
      </label>
    </div>
  )
}

export function FollowupConfigModal({ model }: Props) {
  return (
    <Modal
      centered
      footer={null}
      open={model.followupModalOpen}
      title={t('purchase.followup.form.modalTitle')}
      width={1040}
      onCancel={() => model.setFollowupModalOpen(false)}
    >
      <div className="workflow-modal-content entity-modal-form">
        <PanelTitle
          icon={<LayoutDashboard size={18} />}
          title={t('purchase.followup.form.templateTitle')}
        />
        <form className="record-form" onSubmit={model.saveFollowupTemplate}>
          <div className="form-pair two">
            <label htmlFor="followup-template-name">
              {t('purchase.followup.field.templateName')}
              <Input
                id="followup-template-name"
                required
                value={model.templateForm.name}
                onChange={(event) =>
                  model.setTemplateForm({ ...model.templateForm, name: event.target.value })
                }
              />
            </label>
            <label>
              {t('purchase.followup.field.defaultTemplate')}
              <Segmented
                aria-label={t('purchase.followup.field.defaultTemplate')}
                className="boolean-segmented"
                options={[
                  { label: t('purchase.followup.form.yes'), value: 'true' },
                  { label: t('purchase.followup.form.no'), value: 'false' },
                ]}
                value={String(model.templateForm.is_default)}
                onChange={(value) =>
                  model.setTemplateForm({ ...model.templateForm, is_default: value === 'true' })
                }
              />
            </label>
            <label className="checkbox-label" htmlFor="followup-template-enabled">
              <input
                aria-label={t('purchase.followup.form.enabled')}
                checked={model.templateForm.enabled}
                id="followup-template-enabled"
                type="checkbox"
                onChange={(event) =>
                  model.setTemplateForm({
                    ...model.templateForm,
                    enabled: event.target.checked,
                  })
                }
              />
              {t('purchase.followup.form.enabled')}
            </label>
          </div>

          <div className="form-divider">{t('purchase.followup.form.nodeDaysDivider')}</div>
          <FollowupTemplateNodeFields
            daysKey="contract_days"
            label={t('purchase.followup.node.contractConfirmed')}
            remindKey="contract_remind"
            remindLabel={t('purchase.followup.form.contractRemind')}
            setTemplateForm={model.setTemplateForm}
            templateForm={model.templateForm}
          />
          <FollowupTemplateNodeFields
            daysKey="confirm_days"
            label={t('purchase.followup.node.confirmSampleSubmitted')}
            remindKey="confirm_remind"
            remindLabel={t('purchase.followup.form.confirmRemind')}
            setTemplateForm={model.setTemplateForm}
            templateForm={model.templateForm}
          />
          <FollowupTemplateNodeFields
            daysKey="bulk_days"
            label={t('purchase.followup.node.bulkSampleSubmitted')}
            remindKey="bulk_remind"
            remindLabel={t('purchase.followup.form.bulkRemind')}
            setTemplateForm={model.setTemplateForm}
            templateForm={model.templateForm}
          />
          <FollowupTemplateNodeFields
            daysKey="qc_days"
            label={t('purchase.followup.node.qualityInspection')}
            remindKey="qc_remind"
            remindLabel={t('purchase.followup.form.qcRemind')}
            setTemplateForm={model.setTemplateForm}
            templateForm={model.templateForm}
          />
          <FollowupTemplateNodeFields
            daysKey="inbound_days"
            label={t('purchase.followup.node.inboundCompleted')}
            remindKey="inbound_remind"
            remindLabel={t('purchase.followup.form.inboundRemind')}
            setTemplateForm={model.setTemplateForm}
            templateForm={model.templateForm}
          />
          <FollowupTemplateNodeFields
            daysKey="outbound_days"
            label={t('purchase.followup.node.outboundCompleted')}
            remindKey="outbound_remind"
            remindLabel={t('purchase.followup.form.outboundRemind')}
            setTemplateForm={model.setTemplateForm}
            templateForm={model.templateForm}
          />
          <Button htmlType="submit" loading={model.submitting} type="primary">
            {t('purchase.followup.action.saveTemplate')}
          </Button>
        </form>

        <form
          className="record-form accessory-form generation-form"
          onSubmit={model.generateFollowupPlan}
        >
          <div className="form-divider">{t('purchase.followup.form.generateDivider')}</div>
          <label htmlFor="followup-contract-id">
            {t('purchase.followup.field.purchaseContractId')}
            <Input
              id="followup-contract-id"
              required
              value={model.planForm.purchase_contract_id}
              onChange={(event) =>
                model.setPlanForm({
                  ...model.planForm,
                  purchase_contract_id: event.target.value,
                })
              }
            />
          </label>
          <label htmlFor="followup-base-date">
            {t('purchase.followup.field.baseDate')}
            <Input
              id="followup-base-date"
              type="date"
              value={model.planForm.as_of}
              onChange={(event) =>
                model.setPlanForm({ ...model.planForm, as_of: event.target.value })
              }
            />
          </label>
          <Button htmlType="submit" loading={model.submitting}>
            {t('purchase.followup.action.generatePlan')}
          </Button>
        </form>

        <form
          className="record-form accessory-form generation-form"
          onSubmit={model.syncFollowupSourceEventFromForm}
        >
          <div className="form-divider">{t('purchase.followup.form.sourceDivider')}</div>
          <label htmlFor="followup-source-contract-id">
            {t('purchase.followup.field.purchaseContractId')}
            <Input
              id="followup-source-contract-id"
              required
              value={model.sourceEventForm.purchase_contract_id}
              onChange={(event) =>
                model.setSourceEventForm({
                  ...model.sourceEventForm,
                  purchase_contract_id: event.target.value,
                })
              }
            />
          </label>
          <div className="form-pair two">
            <label>
              {t('purchase.followup.field.node')}
              <FormSelect
                value={model.sourceEventForm.node_code}
                onChange={(event) =>
                  model.setSourceEventForm({
                    ...model.sourceEventForm,
                    node_code: event.target.value,
                    source_record_type: followupSourceTypeForNode(event.target.value),
                  })
                }
              >
                {followupNodeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </option>
                ))}
              </FormSelect>
            </label>
            <label>
              {t('purchase.followup.field.sourceType')}
              <FormSelect
                value={model.sourceEventForm.source_record_type}
                onChange={(event) =>
                  model.setSourceEventForm({
                    ...model.sourceEventForm,
                    source_record_type: event.target.value,
                  })
                }
              >
                {followupSourceTypeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {t(item.labelKey)}
                  </option>
                ))}
              </FormSelect>
            </label>
          </div>
          <div className="form-pair two">
            <label htmlFor="followup-source-id">
              {t('purchase.followup.field.sourceRecordId')}
              <Input
                id="followup-source-id"
                required
                value={model.sourceEventForm.source_record_id}
                onChange={(event) =>
                  model.setSourceEventForm({
                    ...model.sourceEventForm,
                    source_record_id: event.target.value,
                  })
                }
              />
            </label>
            <label htmlFor="followup-actual-date">
              {t('purchase.followup.field.actualDate')}
              <Input
                id="followup-actual-date"
                required
                type="date"
                value={model.sourceEventForm.actual_date}
                onChange={(event) =>
                  model.setSourceEventForm({
                    ...model.sourceEventForm,
                    actual_date: event.target.value,
                  })
                }
              />
            </label>
          </div>
          <label htmlFor="followup-source-summary">
            {t('purchase.followup.field.sourceSummary')}
            <Input
              id="followup-source-summary"
              required
              value={model.sourceEventForm.source_summary}
              onChange={(event) =>
                model.setSourceEventForm({
                  ...model.sourceEventForm,
                  source_summary: event.target.value,
                })
              }
            />
          </label>
          <Button htmlType="submit" loading={model.submitting}>
            {t('purchase.followup.action.syncSource')}
          </Button>
        </form>
      </div>
    </Modal>
  )
}
