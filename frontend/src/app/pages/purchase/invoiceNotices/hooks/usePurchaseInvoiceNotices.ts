// 开票通知：列表数据、URL 筛选同步、生成/发送/收票动作

import type { FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  generatePurchaseInvoiceNoticesFromDeclaration,
  listPurchaseInvoiceNoticeReminders,
  listPurchaseInvoiceNotices,
  receivePurchaseInvoiceNoticeTaxInvoice,
  sendPurchaseInvoiceNotice,
  type PurchaseInvoiceNotice,
  type PurchaseInvoiceNoticeListSummary,
  type PurchaseInvoiceNoticeReminder,
} from '@/api'
import { t } from '@/app/appI18n'
import { moduleDetailPath, purchaseInvoiceNoticePath } from '@/app/routes'
import { showError } from '@/shared/errors'
import { useFormModal } from '@/shared/useFormModal'
import { useTablePagination } from '@/shared/useTablePagination'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'
import {
  initialPurchaseInvoiceNoticeForm,
  initialPurchaseInvoiceNoticeReceiveForm,
  initialPurchaseInvoiceNoticeSendForm,
  purchaseInvoiceNoticeGeneratePayload,
  purchaseInvoiceNoticeReceivePayload,
  purchaseInvoiceNoticeSendPayload,
  type PurchaseInvoiceNoticeFormState,
  type PurchaseInvoiceNoticeReceiveFormState,
  type PurchaseInvoiceNoticeSendFormState,
} from '../invoiceNoticeHelpers'

type InvoiceNoticeFilters = {
  q: string
  status: string
  supplier: string
  customs: string
}

type Args = {
  detailId: string | null
  onNavigate: (path: string) => void
}

export type PurchaseInvoiceNoticesModel = {
  notices: PurchaseInvoiceNotice[]
  reminders: PurchaseInvoiceNoticeReminder[]
  summary: PurchaseInvoiceNoticeListSummary
  selectedNotice: PurchaseInvoiceNotice | null
  selectedNoticeId: string | null
  setSelectedNoticeId: (id: string | null) => void
  search: string
  setSearch: (value: string) => void
  statusFilter: string
  setStatusFilter: (value: string) => void
  supplierFilter: string
  setSupplierFilter: (value: string) => void
  customsFilter: string
  setCustomsFilter: (value: string) => void
  loading: boolean
  submitting: boolean
  message: string
  customsDeclarationNoError: string
  setCustomsDeclarationNoError: (value: string) => void
  invoiceModalOpen: boolean
  invoiceSubmitting: boolean
  form: PurchaseInvoiceNoticeFormState
  setForm: (form: PurchaseInvoiceNoticeFormState) => void
  sendForm: PurchaseInvoiceNoticeSendFormState
  setSendForm: (form: PurchaseInvoiceNoticeSendFormState) => void
  receiveForm: PurchaseInvoiceNoticeReceiveFormState
  setReceiveForm: (form: PurchaseInvoiceNoticeReceiveFormState) => void
  invoiceActionModal: 'send' | 'receive' | null
  setInvoiceActionModal: (value: 'send' | 'receive' | null) => void
  total: number
  pagination: ReturnType<typeof useTablePagination>['pagination']
  goToPage: (nextPage: number, nextPageSize: number) => void
  submitSearch: () => void
  openGenerateModal: () => void
  closeGenerateModal: () => void
  generateFromCustoms: (event: FormEvent<HTMLFormElement>) => Promise<void>
  sendSelectedNotice: (event: FormEvent<HTMLFormElement>) => Promise<void>
  receiveSelectedNotice: (event: FormEvent<HTMLFormElement>) => Promise<void>
  openInvoiceNoticeDetail: (notice: PurchaseInvoiceNotice) => void
}

export function usePurchaseInvoiceNotices({
  detailId,
  onNavigate,
}: Args): PurchaseInvoiceNoticesModel {
  const urlQuery = useUrlQuery()
  const appliedUrlSearchRef = useRef(urlQuery.search)
  const [notices, setNotices] = useState<PurchaseInvoiceNotice[]>([])
  const [summary, setSummary] = useState<PurchaseInvoiceNoticeListSummary>({
    sent_count: 0,
    received_count: 0,
    total_amount: '0',
    currency: null,
  })
  const [reminders, setReminders] = useState<PurchaseInvoiceNoticeReminder[]>([])
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null)
  const [search, setSearch] = useState(() => urlQuery.params.get('q') ?? '')
  const [statusFilter, setStatusFilter] = useState(() => urlQuery.params.get('status') ?? '')
  const [supplierFilter, setSupplierFilter] = useState(() => urlQuery.params.get('supplier') ?? '')
  const [customsFilter, setCustomsFilter] = useState(() => urlQuery.params.get('customs') ?? '')
  const [loading, setLoading] = useState(false)
  const { page, pageSize, total, setTotal, setPage, changePage, pagination } = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params),
  )
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [customsDeclarationNoError, setCustomsDeclarationNoError] = useState('')
  const [invoiceActionModal, setInvoiceActionModal] = useState<'send' | 'receive' | null>(null)
  const {
    open: invoiceModalOpen,
    form,
    setForm,
    submitting: invoiceSubmitting,
    openWith: openInvoiceModal,
    close: closeInvoiceModal,
    runSubmit: runInvoiceSubmit,
  } = useFormModal(initialPurchaseInvoiceNoticeForm)
  const [sendForm, setSendForm] = useState<PurchaseInvoiceNoticeSendFormState>(() =>
    initialPurchaseInvoiceNoticeSendForm(),
  )
  const [receiveForm, setReceiveForm] = useState<PurchaseInvoiceNoticeReceiveFormState>(() =>
    initialPurchaseInvoiceNoticeReceiveForm(),
  )

  const selectedNotice = useMemo(() => {
    if (detailId) return notices.find((item) => item.id === detailId) ?? null
    return notices.find((item) => item.id === selectedNoticeId) ?? notices[0] ?? null
  }, [detailId, notices, selectedNoticeId])

  useEffect(() => {
    void loadNotices()
  }, [])

  useEffect(() => {
    if (appliedUrlSearchRef.current === urlQuery.search) return
    appliedUrlSearchRef.current = urlQuery.search
    const nextFilters = {
      q: urlQuery.params.get('q') ?? '',
      status: urlQuery.params.get('status') ?? '',
      supplier: urlQuery.params.get('supplier') ?? '',
      customs: urlQuery.params.get('customs') ?? '',
    }
    setSearch(nextFilters.q)
    setStatusFilter(nextFilters.status)
    setSupplierFilter(nextFilters.supplier)
    setCustomsFilter(nextFilters.customs)
    const nextPage = parsePageParam(urlQuery.params)
    setPage(nextPage)
    void loadNotices(undefined, undefined, nextPage, pageSize, nextFilters)
  }, [urlQuery.search])

  useEffect(() => {
    setSendForm((current) => ({
      ...current,
      sent_at: selectedNotice?.sent_at ?? selectedNotice?.notice_date ?? current.sent_at,
    }))
    setReceiveForm((current) => ({
      ...current,
      received_at:
        selectedNotice?.tax_invoice_received_at ?? selectedNotice?.sent_at ?? current.received_at,
    }))
  }, [selectedNotice?.id, selectedNotice?.status])

  useEffect(() => {
    if (detailId && notices.length > 0 && !notices.some((item) => item.id === detailId)) {
      onNavigate(purchaseInvoiceNoticePath)
    }
  }, [detailId, notices, onNavigate])

  async function loadNotices(
    preferredId?: string,
    overrideCustomsFilter?: string,
    pageOverride?: number,
    pageSizeOverride?: number,
    filtersOverride?: InvoiceNoticeFilters,
  ) {
    const resolvedPage = pageOverride ?? page
    const resolvedPageSize = pageSizeOverride ?? pageSize
    setLoading(true)
    try {
      const [noticeResult, reminderResult] = await Promise.all([
        listPurchaseInvoiceNotices({
          q: (filtersOverride?.q ?? search).trim() || undefined,
          status: (filtersOverride?.status ?? statusFilter) || undefined,
          supplier_id: (filtersOverride?.supplier ?? supplierFilter).trim() || undefined,
          customs_declaration_id:
            (filtersOverride?.customs ?? overrideCustomsFilter ?? customsFilter).trim() ||
            undefined,
          limit: resolvedPageSize,
          offset: (resolvedPage - 1) * resolvedPageSize,
        }),
        listPurchaseInvoiceNoticeReminders(),
      ])
      setTotal(noticeResult.total)
      setSummary(noticeResult.summary)
      if (noticeResult.items.length === 0 && resolvedPage > 1) {
        const prevPage = resolvedPage - 1
        setPage(prevPage)
        appliedUrlSearchRef.current = urlQuery.update({
          page: prevPage === 1 ? null : prevPage,
        })
        await loadNotices(
          preferredId,
          overrideCustomsFilter,
          prevPage,
          resolvedPageSize,
          filtersOverride,
        )
        return
      }
      setNotices(noticeResult.items)
      setReminders(reminderResult.items)
      const nextSelectedId =
        preferredId ??
        (noticeResult.items.some((item) => item.id === selectedNoticeId)
          ? selectedNoticeId
          : null) ??
        noticeResult.items[0]?.id ??
        null
      setSelectedNoticeId(nextSelectedId)
    } catch (caught) {
      showError(caught, t('purchase.invoiceNotice.list.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  function upsertNotice(notice: PurchaseInvoiceNotice) {
    setNotices((current) => {
      const exists = current.some((item) => item.id === notice.id)
      return exists
        ? current.map((item) => (item.id === notice.id ? notice : item))
        : [notice, ...current]
    })
    setSelectedNoticeId(notice.id)
  }

  function openInvoiceNoticeDetail(notice: PurchaseInvoiceNotice) {
    setSelectedNoticeId(notice.id)
    onNavigate(moduleDetailPath(purchaseInvoiceNoticePath, notice.id))
  }

  function openGenerateModal() {
    setCustomsDeclarationNoError('')
    openInvoiceModal()
  }

  function closeGenerateModal() {
    closeInvoiceModal()
  }

  async function generateFromCustoms(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.customs_declaration_no.trim()) {
      setCustomsDeclarationNoError(
        t('purchase.invoiceNotice.validation.customsDeclarationNoRequired'),
      )
      return
    }
    setCustomsDeclarationNoError('')
    setMessage('')
    await runInvoiceSubmit(
      async () => {
        const customsId = form.customs_declaration_id.trim()
        const result = await generatePurchaseInvoiceNoticesFromDeclaration(
          purchaseInvoiceNoticeGeneratePayload(form),
        )
        const firstNotice = result.items[0] ?? null
        setSearch('')
        setStatusFilter('')
        setSupplierFilter('')
        setCustomsFilter(customsId)
        setMessage(t('purchase.invoiceNotice.message.generated', { count: result.total }))
        closeInvoiceModal()
        if (firstNotice) upsertNotice(firstNotice)
        await loadNotices(firstNotice?.id, customsId)
      },
      (caught) => showError(caught, t('purchase.invoiceNotice.message.generateFailed')),
    )
  }

  async function sendSelectedNotice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedNotice) return
    setSubmitting(true)
    setMessage('')
    try {
      const sent = await sendPurchaseInvoiceNotice(
        selectedNotice.id,
        purchaseInvoiceNoticeSendPayload(sendForm),
      )
      setMessage(t('purchase.invoiceNotice.message.sent', { code: sent.code }))
      setInvoiceActionModal(null)
      upsertNotice(sent)
      await loadNotices(sent.id)
    } catch (caught) {
      showError(caught, t('purchase.invoiceNotice.message.sendFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  async function receiveSelectedNotice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedNotice) return
    setSubmitting(true)
    setMessage('')
    try {
      const received = await receivePurchaseInvoiceNoticeTaxInvoice(
        selectedNotice.id,
        purchaseInvoiceNoticeReceivePayload(receiveForm),
      )
      setMessage(
        t('purchase.invoiceNotice.message.received', { no: received.tax_invoice_no ?? '' }),
      )
      setInvoiceActionModal(null)
      upsertNotice(received)
      await loadNotices(received.id)
    } catch (caught) {
      showError(caught, t('purchase.invoiceNotice.message.receiveFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  function submitSearch() {
    setPage(1)
    appliedUrlSearchRef.current = urlQuery.update({
      q: search,
      status: statusFilter,
      supplier: supplierFilter,
      customs: customsFilter,
      page: null,
    })
    void loadNotices(undefined, undefined, 1)
  }

  function goToPage(nextPage: number, nextPageSize: number) {
    const next = changePage(nextPage, nextPageSize)
    appliedUrlSearchRef.current = urlQuery.update({
      page: next.page === 1 ? null : next.page,
    })
    void loadNotices(undefined, undefined, next.page, next.pageSize)
  }

  return {
    notices,
    reminders,
    summary,
    selectedNotice,
    selectedNoticeId,
    setSelectedNoticeId,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    supplierFilter,
    setSupplierFilter,
    customsFilter,
    setCustomsFilter,
    loading,
    submitting,
    message,
    customsDeclarationNoError,
    setCustomsDeclarationNoError,
    invoiceModalOpen,
    invoiceSubmitting,
    form,
    setForm,
    sendForm,
    setSendForm,
    receiveForm,
    setReceiveForm,
    invoiceActionModal,
    setInvoiceActionModal,
    total,
    pagination,
    goToPage,
    submitSearch,
    openGenerateModal,
    closeGenerateModal,
    generateFromCustoms,
    sendSelectedNotice,
    receiveSelectedNotice,
    openInvoiceNoticeDetail,
  }
}
