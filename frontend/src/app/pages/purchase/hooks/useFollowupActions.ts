import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createFollowupTemplate,
  generateFollowupPlanFromPurchaseContract,
  listFollowupOverdueNodes,
  syncFollowupSampleEvents,
  syncFollowupSourceEvent,
  updateFollowupTemplate,
  type FollowProcessTemplate,
  type PurchaseFollowOverdueNode,
  type PurchaseFollowNode,
  type PurchaseFollowPlan,
} from '@/api'
import { showError } from '@/shared/errors'
import { todayInputValue } from '@/app/pages/appHelpers'
import { t } from '@/app/appI18n'
import {
  followupNodeLabel,
  followupPlanGeneratePayload,
  followupSourceEventFormForPlan,
  followupSourceEventPayload,
  followupSourceTypeForNode,
  followupTemplatePayload,
  followupTemplateToForm,
  initialFollowupPlanForm,
  initialFollowupSourceEventForm,
  initialFollowupTemplateForm,
  initialNodeCompletionForm,
  type FollowupPlanFormState,
  type FollowupSourceEventFormState,
  type FollowupTemplateFormState,
} from '../followupHelpers'

type UseFollowupActionsArgs = {
  applyGeneratedPlan: (plan: PurchaseFollowPlan) => Promise<void>
  applySavedTemplate: (templateId: string) => Promise<void>
  overdueAsOf: string
  reload: (preferredPlanId?: string) => Promise<void>
  selectedPlan: PurchaseFollowPlan | null
  selectedTemplate: FollowProcessTemplate | null
  setOverdueAsOf: (value: string) => void
  setOverdueNodes: (nodes: PurchaseFollowOverdueNode[]) => void
}

export function useFollowupActions({
  applyGeneratedPlan,
  applySavedTemplate,
  overdueAsOf,
  reload,
  selectedPlan,
  selectedTemplate,
  setOverdueAsOf,
  setOverdueNodes,
}: UseFollowupActionsArgs) {
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [followupModalOpen, setFollowupModalOpen] = useState(false)
  const [nodeActionNode, setNodeActionNode] = useState<PurchaseFollowNode | null>(null)
  const [templateForm, setTemplateForm] = useState<FollowupTemplateFormState>(() =>
    initialFollowupTemplateForm(),
  )
  const [planForm, setPlanForm] = useState<FollowupPlanFormState>(() => initialFollowupPlanForm())
  const [sourceEventForm, setSourceEventForm] = useState<FollowupSourceEventFormState>(() =>
    initialFollowupSourceEventForm(),
  )
  const [nodeCompletionForm, setNodeCompletionForm] = useState<FollowupSourceEventFormState>(() =>
    initialNodeCompletionForm(),
  )

  useEffect(() => {
    setTemplateForm(followupTemplateToForm(selectedTemplate))
  }, [selectedTemplate?.id])

  useEffect(() => {
    if (!selectedPlan) return
    setPlanForm({
      purchase_contract_id: selectedPlan.purchase_contract_id,
      as_of: selectedPlan.base_date,
    })
    setSourceEventForm((current) => followupSourceEventFormForPlan(selectedPlan, current))
  }, [selectedPlan?.id, selectedPlan?.overall_status])

  async function saveFollowupTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const payload = followupTemplatePayload(templateForm)
      const template = selectedTemplate
        ? await updateFollowupTemplate(selectedTemplate.id, payload)
        : await createFollowupTemplate(payload)
      setMessage(t('purchase.followup.message.templateSaved', { name: template.name }))
      setFollowupModalOpen(false)
      await applySavedTemplate(template.id)
    } catch (caught) {
      showError(caught, t('purchase.followup.message.templateSaveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function generateFollowupPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const plan = await generateFollowupPlanFromPurchaseContract(
        followupPlanGeneratePayload(planForm),
      )
      setFollowupModalOpen(false)
      await applyGeneratedPlan(plan)
      setMessage(t('purchase.followup.message.planGenerated', { no: plan.purchase_contract_no }))
    } catch (caught) {
      showError(caught, t('purchase.followup.message.planGenerateFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function syncSelectedFollowupSampleEvents() {
    if (!selectedPlan) return
    setSubmitting(true)
    setMessage('')
    try {
      const synced = await syncFollowupSampleEvents({
        purchase_contract_id: selectedPlan.purchase_contract_id,
        as_of: selectedPlan.base_date,
      })
      await reload(synced.id)
      setMessage(
        t('purchase.followup.message.sampleSynced', { no: synced.purchase_contract_no }),
      )
    } catch (caught) {
      showError(caught, t('purchase.followup.message.sampleSyncFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function syncFollowupSourceEventFromForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const nodeLabel = followupNodeLabel(sourceEventForm.node_code)
      const plan = await syncFollowupSourceEvent(followupSourceEventPayload(sourceEventForm))
      setFollowupModalOpen(false)
      await reload(plan.id)
      setMessage(t('purchase.followup.message.sourceSynced', { name: nodeLabel }))
    } catch (caught) {
      showError(caught, t('purchase.followup.message.sourceSyncFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function openNodeCompletion(node: PurchaseFollowNode) {
    if (!selectedPlan) return
    setNodeCompletionForm({
      purchase_contract_id: selectedPlan.purchase_contract_id,
      node_code: node.node_code,
      source_record_type: followupSourceTypeForNode(node.node_code),
      source_record_id: '',
      actual_date: todayInputValue(),
      source_summary: '',
    })
    setNodeActionNode(node)
  }

  async function completeNodeFromForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!nodeActionNode || !selectedPlan) return
    setSubmitting(true)
    setMessage('')
    try {
      const plan = await syncFollowupSourceEvent(followupSourceEventPayload(nodeCompletionForm))
      const completedNodeName = followupNodeLabel(
        nodeActionNode.node_code,
        nodeActionNode.node_name,
      )
      setNodeActionNode(null)
      await reload(plan.id)
      setMessage(t('purchase.followup.message.nodeCompleted', { name: completedNodeName }))
    } catch (caught) {
      showError(
        caught,
        t('purchase.followup.message.nodeCompleteFailed', {
          name: followupNodeLabel(nodeActionNode.node_code, nodeActionNode.node_name),
        }),
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function scanFollowupOverdueNodes(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      const overdue = await listFollowupOverdueNodes(overdueAsOf)
      setOverdueNodes(overdue.items)
      setMessage(t('purchase.followup.message.overdueFound', { count: overdue.total }))
    } catch (caught) {
      showError(caught, t('purchase.followup.message.overdueScanFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return {
    completeNodeFromForm,
    followupModalOpen,
    generateFollowupPlan,
    message,
    nodeActionNode,
    nodeCompletionForm,
    openNodeCompletion,
    planForm,
    saveFollowupTemplate,
    scanFollowupOverdueNodes,
    setFollowupModalOpen,
    setNodeActionNode,
    setNodeCompletionForm,
    setOverdueAsOf,
    setPlanForm,
    setSourceEventForm,
    setTemplateForm,
    sourceEventForm,
    submitting,
    syncFollowupSourceEventFromForm,
    syncSelectedFollowupSampleEvents,
    templateForm,
  }
}
