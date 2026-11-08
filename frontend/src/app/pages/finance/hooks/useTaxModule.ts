import type { FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createVerificationDocument,
  listVerificationDocuments,
  listVerificationUsage,
  registerVerification,
  registerVerificationCustomsReceipt,
  registerTaxRefund,
  type VerificationDocument,
  type VerificationUsageItem,
} from '@/api'
import { showError } from '@/shared/errors'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'
import { useTablePagination } from '@/shared/useTablePagination'
import { t } from '@/app/appI18n'
import {
  VerificationDocumentFormState,
  CustomsReceiptFormState,
  VerificationRegisterFormState,
  TaxRefundFormState,
  initialVerificationDocumentForm,
  initialCustomsReceiptForm,
  initialVerificationRegisterForm,
  initialTaxRefundForm,
  verificationDocumentPayload,
  customsReceiptPayload,
  verificationRegisterPayload,
  taxRefundPayload,
} from '@/app/pages/finance/financeHelpers'

import type { FinanceModuleEnv } from '@/app/pages/finance/financePageTypes'

type DocumentFilters = {
  q: string
  status: string
  reminder: string
  owner: string
  shipment: string
}

type UsageFilters = { q: string; status: string; reminder: string; shipment: string }

function documentFiltersFromParams(params: URLSearchParams): DocumentFilters {
  return {
    q: params.get('documents_q') ?? '',
    status: params.get('documents_status') ?? '',
    reminder: params.get('documents_reminder') ?? '',
    owner: params.get('documents_owner') ?? '',
    shipment: params.get('documents_shipment') ?? '',
  }
}

function usageFiltersFromParams(params: URLSearchParams): UsageFilters {
  return {
    q: params.get('usage_q') ?? '',
    status: params.get('usage_status') ?? '',
    reminder: params.get('usage_reminder') ?? '',
    shipment: params.get('usage_shipment') ?? '',
  }
}

function documentSignature(params: URLSearchParams): string {
  return JSON.stringify([
    parsePageParam(params, 'documents_page'),
    documentFiltersFromParams(params),
  ])
}

function usageSignature(params: URLSearchParams): string {
  return JSON.stringify(usageFiltersFromParams(params))
}

export function useTaxModule(env: FinanceModuleEnv) {
  const { activeModule, detailId, setMessage, setError, loadOverview } = env

  const urlQuery = useUrlQuery()

  const verificationDocumentsPager = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params, 'documents_page'),
  )

  const [documentFilters, setDocumentFilters] = useState(() =>
    documentFiltersFromParams(urlQuery.params),
  )

  const appliedDocumentSignatureRef = useRef(documentSignature(urlQuery.params))

  const [usageFilters, setUsageFilters] = useState(() => usageFiltersFromParams(urlQuery.params))

  const appliedUsageSignatureRef = useRef(usageSignature(urlQuery.params))

  const [verificationDocuments, setVerificationDocuments] = useState<VerificationDocument[]>([])

  const [verificationUsage, setVerificationUsage] = useState<VerificationUsageItem[]>([])

  const [selectedVerificationDocumentId, setSelectedVerificationDocumentId] = useState<
    string | null
  >(null)

  const [verificationDocumentForm, setVerificationDocumentForm] =
    useState<VerificationDocumentFormState>(() => initialVerificationDocumentForm())

  const [customsReceiptForm, setCustomsReceiptForm] = useState<CustomsReceiptFormState>(() =>
    initialCustomsReceiptForm(),
  )

  const [verificationRegisterForm, setVerificationRegisterForm] =
    useState<VerificationRegisterFormState>(() => initialVerificationRegisterForm())

  const [taxRefundForm, setTaxRefundForm] = useState<TaxRefundFormState>(() =>
    initialTaxRefundForm(),
  )

  const [loadingVerificationDocuments, setLoadingVerificationDocuments] = useState(false)

  const [loadingVerificationUsage, setLoadingVerificationUsage] = useState(false)

  const [taxDocumentModalOpen, setTaxDocumentModalOpen] = useState(false)

  const [submittingVerificationDocument, setSubmittingVerificationDocument] = useState(false)

  const [submittingCustomsReceipt, setSubmittingCustomsReceipt] = useState(false)

  const [customsReceiptErrors, setCustomsReceiptErrors] = useState<{
    customs_declaration_no?: string
    customs_receipt_no?: string
  }>({})

  const [submittingVerificationRegister, setSubmittingVerificationRegister] = useState(false)

  const [submittingTaxRefund, setSubmittingTaxRefund] = useState(false)

  const selectedVerificationDocument = useMemo(
    () =>
      verificationDocuments.find((item) => item.id === selectedVerificationDocumentId) ??
      verificationDocuments[0] ??
      null,
    [verificationDocuments, selectedVerificationDocumentId],
  )

  useEffect(() => {
    if (!selectedVerificationDocument) return
    setTaxRefundForm((current) => ({
      ...current,
      amount: selectedVerificationDocument.unrefunded_amount,
      currency: selectedVerificationDocument.currency,
    }))
  }, [
    selectedVerificationDocument?.id,
    selectedVerificationDocument?.unrefunded_amount,
    selectedVerificationDocument?.currency,
  ])

  async function loadVerificationDocuments(
    preferredId?: string,
    pageOverride?: number,
    pageSizeOverride?: number,
    filtersOverride?: DocumentFilters,
  ) {
    setLoadingVerificationDocuments(true)
    setError('')
    try {
      const filters = filtersOverride ?? documentFilters
      const page = pageOverride ?? verificationDocumentsPager.page
      const pageSize = pageSizeOverride ?? verificationDocumentsPager.pageSize
      const result = await listVerificationDocuments({
        q: filters.q.trim() || undefined,
        status: filters.status || undefined,
        owner_user_id: filters.owner.trim() || undefined,
        shipment_no: filters.shipment.trim() || undefined,
        reminder_status: filters.reminder || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      setVerificationDocuments(result.items)
      verificationDocumentsPager.setTotal(result.total)
      const nextDocumentId =
        preferredId ??
        (activeModule === 'tax' && result.items.some((item) => item.id === detailId)
          ? detailId
          : null) ??
        (result.items.some((item) => item.id === selectedVerificationDocumentId)
          ? selectedVerificationDocumentId
          : null) ??
        result.items[0]?.id ??
        null
      setSelectedVerificationDocumentId(nextDocumentId)
    } catch (caught) {
      showError(caught, t('finance.tax.message.loadDocumentsFailed'))
    } finally {
      setLoadingVerificationDocuments(false)
    }
  }

  async function changeVerificationDocumentsPage(nextPage: number, nextPageSize: number) {
    const next = verificationDocumentsPager.changePage(nextPage, nextPageSize)
    const nextSearch = urlQuery.update({
      documents_page: next.page === 1 ? null : next.page,
      documents_q: documentFilters.q,
      documents_status: documentFilters.status,
      documents_reminder: documentFilters.reminder,
      documents_owner: documentFilters.owner,
      documents_shipment: documentFilters.shipment,
    })
    appliedDocumentSignatureRef.current = documentSignature(new URLSearchParams(nextSearch))
    await loadVerificationDocuments(undefined, next.page, next.pageSize, documentFilters)
  }

  useEffect(() => {
    const signature = documentSignature(urlQuery.params)
    if (appliedDocumentSignatureRef.current === signature) return
    appliedDocumentSignatureRef.current = signature
    const filters = documentFiltersFromParams(urlQuery.params)
    const nextPage = parsePageParam(urlQuery.params, 'documents_page')
    setDocumentFilters(filters)
    verificationDocumentsPager.setPage(nextPage)
    void loadVerificationDocuments(undefined, nextPage, verificationDocumentsPager.pageSize, filters)
  }, [urlQuery.search])

  async function applyVerificationUsageFilters() {
    const nextSearch = urlQuery.update({
      usage_q: usageFilters.q,
      usage_status: usageFilters.status,
      usage_reminder: usageFilters.reminder,
      usage_shipment: usageFilters.shipment,
    })
    appliedUsageSignatureRef.current = usageSignature(new URLSearchParams(nextSearch))
    await loadVerificationUsage(usageFilters)
  }

  useEffect(() => {
    const signature = usageSignature(urlQuery.params)
    if (appliedUsageSignatureRef.current === signature) return
    appliedUsageSignatureRef.current = signature
    const filters = usageFiltersFromParams(urlQuery.params)
    setUsageFilters(filters)
    void loadVerificationUsage(filters)
  }, [urlQuery.search])

  async function loadVerificationUsage(filtersOverride?: UsageFilters) {
    setLoadingVerificationUsage(true)
    setError('')
    try {
      const filters = filtersOverride ?? usageFilters
      const result = await listVerificationUsage({
        q: filters.q.trim() || undefined,
        status: filters.status || undefined,
        shipment_no: filters.shipment.trim() || undefined,
        reminder_status: filters.reminder || undefined,
      })
      setVerificationUsage(result.items)
    } catch (caught) {
      showError(caught, t('finance.tax.message.loadUsageFailed'))
    } finally {
      setLoadingVerificationUsage(false)
    }
  }

  async function submitVerificationDocument(
    event: FormEvent<HTMLFormElement>,
  ): Promise<boolean> {
    event.preventDefault()
    setSubmittingVerificationDocument(true)
    setMessage('')
    setError('')
    try {
      const created = await createVerificationDocument(
        verificationDocumentPayload(verificationDocumentForm),
      )
      setMessage(t('finance.tax.message.documentIssued', { code: created.document_no }))
      setVerificationDocumentForm(initialVerificationDocumentForm())
      await loadVerificationDocuments(created.id)
      await loadVerificationUsage()
      return true
    } catch (caught) {
      showError(caught, t('finance.tax.message.documentIssueFailed'))
      return false
    } finally {
      setSubmittingVerificationDocument(false)
    }
  }

  async function submitCustomsReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedVerificationDocument) return
    const nextErrors: typeof customsReceiptErrors = {}
    if (!customsReceiptForm.customs_declaration_no.trim()) {
      nextErrors.customs_declaration_no = t('finance.tax.validation.customsDeclarationNoRequired')
    }
    if (!customsReceiptForm.customs_receipt_no.trim()) {
      nextErrors.customs_receipt_no = t('finance.tax.validation.customsReceiptNoRequired')
    }
    if (Object.keys(nextErrors).length > 0) {
      setCustomsReceiptErrors(nextErrors)
      return
    }
    setCustomsReceiptErrors({})
    setSubmittingCustomsReceipt(true)
    setMessage('')
    setError('')
    try {
      const updated = await registerVerificationCustomsReceipt(
        selectedVerificationDocument.id,
        customsReceiptPayload(customsReceiptForm),
      )
      setMessage(
        t('finance.tax.message.customsReceiptRegistered', {
          code: updated.customs_receipt_no ?? updated.document_no,
        }),
      )
      setCustomsReceiptForm(initialCustomsReceiptForm())
      await loadVerificationDocuments(updated.id)
      await loadVerificationUsage()
    } catch (caught) {
      showError(caught, t('finance.tax.message.customsReceiptRegisterFailed'))
    } finally {
      setSubmittingCustomsReceipt(false)
    }
  }

  async function submitVerificationRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedVerificationDocument) return
    setSubmittingVerificationRegister(true)
    setMessage('')
    setError('')
    try {
      const updated = await registerVerification(
        selectedVerificationDocument.id,
        verificationRegisterPayload(verificationRegisterForm),
      )
      setMessage(t('finance.tax.message.verificationRegistered', { code: updated.document_no }))
      setVerificationRegisterForm(initialVerificationRegisterForm())
      await loadVerificationDocuments(updated.id)
      await loadVerificationUsage()
    } catch (caught) {
      showError(caught, t('finance.tax.message.verificationRegisterFailed'))
    } finally {
      setSubmittingVerificationRegister(false)
    }
  }

  async function submitTaxRefund(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedVerificationDocument) return
    setSubmittingTaxRefund(true)
    setMessage('')
    setError('')
    try {
      const updated = await registerTaxRefund(
        selectedVerificationDocument.id,
        taxRefundPayload(taxRefundForm),
      )
      setMessage(t('finance.tax.message.refundRegistered', { code: updated.document_no }))
      setTaxRefundForm(initialTaxRefundForm(updated.currency, updated.unrefunded_amount))
      await loadVerificationDocuments(updated.id)
      await loadVerificationUsage()
      await loadOverview()
    } catch (caught) {
      showError(caught, t('finance.tax.message.refundRegisterFailed'))
    } finally {
      setSubmittingTaxRefund(false)
    }
  }

  const selectedVerificationCanRegisterCustoms =
    selectedVerificationDocument?.status === 'issued' ||
    selectedVerificationDocument?.status === 'customs_receipt_registered'

  const selectedVerificationCanVerify =
    selectedVerificationDocument?.status === 'customs_receipt_registered' ||
    selectedVerificationDocument?.status === 'verified'

  const selectedVerificationCanRefund =
    selectedVerificationDocument?.status === 'verified' ||
    (selectedVerificationDocument?.status === 'refunded' &&
      Number(selectedVerificationDocument.unrefunded_amount) > 0)

  return {
    applyVerificationUsageFilters,
    changeVerificationDocumentsPage,
    customsReceiptErrors,
    customsReceiptForm,
    loadVerificationDocuments,
    loadVerificationUsage,
    loadingVerificationDocuments,
    loadingVerificationUsage,
    selectedVerificationCanRefund,
    selectedVerificationCanRegisterCustoms,
    selectedVerificationCanVerify,
    selectedVerificationDocument,
    setCustomsReceiptErrors,
    setCustomsReceiptForm,
    setSelectedVerificationDocumentId,
    setTaxDocumentModalOpen,
    setTaxRefundForm,
    setVerificationDocumentForm,
    setVerificationOwnerFilter: (value: string) =>
      setDocumentFilters((current) => ({ ...current, owner: value })),
    setVerificationRegisterForm,
    setVerificationReminderFilter: (value: string) =>
      setDocumentFilters((current) => ({ ...current, reminder: value })),
    setVerificationSearch: (value: string) =>
      setDocumentFilters((current) => ({ ...current, q: value })),
    setVerificationShipmentFilter: (value: string) =>
      setDocumentFilters((current) => ({ ...current, shipment: value })),
    setVerificationStatusFilter: (value: string) =>
      setDocumentFilters((current) => ({ ...current, status: value })),
    setVerificationUsageReminderFilter: (value: string) =>
      setUsageFilters((current) => ({ ...current, reminder: value })),
    setVerificationUsageSearch: (value: string) =>
      setUsageFilters((current) => ({ ...current, q: value })),
    setVerificationUsageShipmentFilter: (value: string) =>
      setUsageFilters((current) => ({ ...current, shipment: value })),
    setVerificationUsageStatusFilter: (value: string) =>
      setUsageFilters((current) => ({ ...current, status: value })),
    submitCustomsReceipt,
    submitTaxRefund,
    submitVerificationDocument,
    submitVerificationRegister,
    submittingCustomsReceipt,
    submittingTaxRefund,
    submittingVerificationDocument,
    submittingVerificationRegister,
    taxDocumentModalOpen,
    taxRefundForm,
    verificationDocumentForm,
    verificationDocuments,
    verificationDocumentsPagination: verificationDocumentsPager.pagination,
    verificationDocumentsTotal: verificationDocumentsPager.total,
    verificationOwnerFilter: documentFilters.owner,
    verificationRegisterForm,
    verificationReminderFilter: documentFilters.reminder,
    verificationSearch: documentFilters.q,
    verificationShipmentFilter: documentFilters.shipment,
    verificationStatusFilter: documentFilters.status,
    verificationUsage,
    verificationUsageReminderFilter: usageFilters.reminder,
    verificationUsageSearch: usageFilters.q,
    verificationUsageShipmentFilter: usageFilters.shipment,
    verificationUsageStatusFilter: usageFilters.status,
  }
}

export type TaxModel = ReturnType<typeof useTaxModule>
