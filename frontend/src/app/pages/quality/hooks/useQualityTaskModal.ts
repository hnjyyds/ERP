import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import {
  createQualityInspection,
  listAssignableUsers,
  listPurchaseContracts,
  type AssignableUser,
  type CurrentUser,
  type QualityInspection,
} from '@/api'
import { showError, showWarningDialog } from '@/shared/errors'
import { useFormModal } from '@/shared/useFormModal'
import { t } from '@/app/appI18n'

import {
  fieldIds,
  fieldLabels,
  initialTaskForm,
  taskPayload,
  validateTaskForm,
  validationErrorsFromApi,
  validationOrder,
  type QualityTaskFormErrors,
  type QualityTaskFormState,
  type QualityTaskValidationField,
} from '../qualityInspectionMeta'

type Options = {
  currentUser: CurrentUser
  setMessage: (message: string) => void
  onCreated: (task: QualityInspection) => Promise<void> | void
}

export function useQualityTaskModal({ currentUser, setMessage, onCreated }: Options) {
  const {
    open: taskModalOpen,
    form,
    setForm,
    submitting: taskSubmitting,
    openWith: openTaskModal,
    close: closeTaskModal,
    runSubmit: runTaskSubmit,
  } = useFormModal<QualityTaskFormState>(() => initialTaskForm(currentUser))
  const [fieldErrors, setFieldErrors] = useState<QualityTaskFormErrors>({})
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([])
  const [assignableUsersLoaded, setAssignableUsersLoaded] = useState(false)
  const [loadingAssignableUsers, setLoadingAssignableUsers] = useState(false)

  const fetchContractOptions = useCallback(async (query: string) => {
    const result = await listPurchaseContracts({
      q: query.trim() || undefined,
      approval_status: 'approved',
    })
    return result.items.slice(0, 20).map((item) => ({
      value: item.id,
      label: `${item.code} / ${item.supplier_name}`,
      description: t('quality.inspection.option.contractSchedule', {
        contractDate: item.contract_date,
        deliveryDate: item.delivery_date,
      }),
    }))
  }, [])

  async function loadAssignableUsersForTask() {
    setLoadingAssignableUsers(true)
    try {
      const result = await listAssignableUsers('quality:inspection:edit')
      setAssignableUsers(result.users)
    } catch (caught) {
      showError(caught, t('quality.inspection.message.assigneesLoadFailed'))
    } finally {
      setAssignableUsersLoaded(true)
      setLoadingAssignableUsers(false)
    }
  }

  useEffect(() => {
    if (!taskModalOpen || assignableUsersLoaded || loadingAssignableUsers) return
    void loadAssignableUsersForTask()
  }, [taskModalOpen, assignableUsersLoaded, loadingAssignableUsers])

  function startNewTask() {
    setFieldErrors({})
    setMessage('')
    if (assignableUsers.length === 0) setAssignableUsersLoaded(false)
    openTaskModal()
  }

  function cancelTaskModal() {
    setFieldErrors({})
    closeTaskModal()
  }

  function updateFormField<Field extends keyof QualityTaskFormState>(
    field: Field,
    value: QualityTaskFormState[Field],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
    if (!validationOrder.includes(field as QualityTaskValidationField)) return
    setFieldErrors((current) => {
      if (!current[field as QualityTaskValidationField]) return current
      const next = { ...current }
      delete next[field as QualityTaskValidationField]
      return next
    })
  }

  function applyInspector(userId: string) {
    const user = assignableUsers.find((item) => item.id === userId)
    setForm((current) => ({
      ...current,
      inspector_id: user?.id ?? '',
      inspector_name: user?.display_name ?? '',
    }))
    setFieldErrors((current) => {
      if (!current.inspector_id) return current
      const next = { ...current }
      delete next.inspector_id
      return next
    })
  }

  function focusField(field: QualityTaskValidationField, keepSummaryVisible = false) {
    window.setTimeout(() => {
      const element = document.getElementById(fieldIds[field])
      if (!(element instanceof HTMLElement)) return
      element.focus({ preventScroll: true })
      const scrollContainer = element.closest('.workflow-modal-content')
      if (keepSummaryVisible && scrollContainer instanceof HTMLElement) {
        scrollContainer.scrollTop = 0
        return
      }
      element.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
    }, 0)
  }

  function applyValidationErrors(errors: QualityTaskFormErrors) {
    const entries = validationOrder.filter((field) => errors[field])
    if (entries.length === 0) return
    setFieldErrors(errors)
    const names = entries.map((field) => t(fieldLabels[field]))
    showWarningDialog(
      t('quality.inspection.message.validationSummary', {
        count: names.length,
        names: names
          .slice(0, 3)
          .join(t('quality.inspection.validation.separator')),
      }),
    )
    focusField(entries[0], true)
  }

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validateTaskForm(form)
    if (validationOrder.some((field) => errors[field])) {
      applyValidationErrors(errors)
      return
    }
    await runTaskSubmit(
      async () => {
        const task = await createQualityInspection(taskPayload(form))
        closeTaskModal()
        setMessage(t('quality.inspection.message.created', { code: task.code }))
        await onCreated(task)
      },
      (caught) => {
        const backendErrors = validationErrorsFromApi(caught)
        if (validationOrder.some((field) => backendErrors[field])) {
          applyValidationErrors(backendErrors)
        } else {
          showError(caught, t('quality.inspection.message.createFailed'))
        }
      },
    )
  }

  const validationEntries = useMemo(
    () =>
      validationOrder.flatMap((field) => {
        const error = fieldErrors[field]
        return error ? [{ field, message: error }] : []
      }),
    [fieldErrors],
  )

  return {
    taskModalOpen,
    form,
    setForm,
    taskSubmitting,
    fieldErrors,
    validationEntries,
    assignableUsers,
    loadingAssignableUsers,
    fetchContractOptions,
    startNewTask,
    cancelTaskModal,
    updateFormField,
    applyInspector,
    focusField,
    createTask,
  }
}
