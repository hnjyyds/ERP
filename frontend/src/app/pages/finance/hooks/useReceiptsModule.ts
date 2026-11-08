import type { FormEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  allocateBankReceipt,
  claimBankReceipt,
  createBankReceipt,
  listBankReceipts,
  listReceivables,
  type BankReceipt,
  type ReceivableItem,
} from '@/api'
import { showError } from '@/shared/errors'
import { parsePageParam, useUrlQuery } from '@/shared/useUrlQuery'
import { useTablePagination } from '@/shared/useTablePagination'
import {
  BankReceiptFormState,
  ReceiptClaimFormState,
  ReceiptAllocationFormState,
  initialBankReceiptForm,
  initialReceiptClaimForm,
  initialReceiptAllocationForm,
  bankReceiptPayload,
  receiptClaimPayload,
  receiptAllocationPayload,
} from '@/app/pages/finance/financeHelpers'
import { t } from '@/app/appI18n'

import type { FinanceModuleEnv } from '@/app/pages/finance/financePageTypes'

type ReceiptFilters = { q: string; status: string; customer: string }

type ReceivableFilters = { q: string; contract: string; invoice: string }

function receiptFiltersFromParams(params: URLSearchParams): ReceiptFilters {
  return {
    q: params.get('receipts_q') ?? '',
    status: params.get('receipts_status') ?? '',
    customer: params.get('receipts_customer') ?? '',
  }
}

function receivableFiltersFromParams(params: URLSearchParams): ReceivableFilters {
  return {
    q: params.get('receivables_q') ?? '',
    contract: params.get('receivables_contract') ?? '',
    invoice: params.get('receivables_invoice') ?? '',
  }
}

function receiptSignature(params: URLSearchParams): string {
  return JSON.stringify([parsePageParam(params, 'receipts_page'), receiptFiltersFromParams(params)])
}

function receivableSignature(params: URLSearchParams): string {
  return JSON.stringify([
    parsePageParam(params, 'receivables_page'),
    receivableFiltersFromParams(params),
  ])
}

export function useReceiptsModule(env: FinanceModuleEnv) {
  const { activeModule, detailId, setMessage, setError } = env

  const urlQuery = useUrlQuery()

  const [receipts, setReceipts] = useState<BankReceipt[]>([])

  const [receivables, setReceivables] = useState<ReceivableItem[]>([])

  const receiptsPager = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params, 'receipts_page'),
  )

  const receivablesPager = useTablePagination(
    undefined,
    parsePageParam(urlQuery.params, 'receivables_page'),
  )

  const [receiptTotals, setReceiptTotals] = useState({
    totalAmount: '0.00',
    unallocatedAmount: '0.00',
    currency: null as string | null,
  })

  const [receivableTotal, setReceivableTotal] = useState('0.00')

  const [receiptFilters, setReceiptFilters] = useState(() =>
    receiptFiltersFromParams(urlQuery.params),
  )

  const appliedReceiptsSignatureRef = useRef(receiptSignature(urlQuery.params))

  const [receivableFilters, setReceivableFilters] = useState(() =>
    receivableFiltersFromParams(urlQuery.params),
  )

  const appliedReceivablesSignatureRef = useRef(receivableSignature(urlQuery.params))

  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null)

  const [receiptForm, setReceiptForm] = useState<BankReceiptFormState>(() =>
    initialBankReceiptForm(),
  )

  const [claimForm, setClaimForm] = useState<ReceiptClaimFormState>(() => initialReceiptClaimForm())

  const [allocationForm, setAllocationForm] = useState<ReceiptAllocationFormState>(() =>
    initialReceiptAllocationForm(),
  )

  const [loadingReceipts, setLoadingReceipts] = useState(false)

  const [loadingReceivables, setLoadingReceivables] = useState(false)

  const [submittingReceipt, setSubmittingReceipt] = useState(false)

  const [receiptModalOpen, setReceiptModalOpen] = useState(false)

  const [submittingClaim, setSubmittingClaim] = useState(false)

  const [submittingAllocation, setSubmittingAllocation] = useState(false)

  const selectedReceipt = useMemo(
    () => receipts.find((item) => item.id === selectedReceiptId) ?? receipts[0] ?? null,
    [receipts, selectedReceiptId],
  )

  async function loadReceipts(
    preferredId?: string,
    pageOverride?: number,
    pageSizeOverride?: number,
    filtersOverride?: ReceiptFilters,
  ) {
    setLoadingReceipts(true)
    setError('')
    try {
      const filters = filtersOverride ?? receiptFilters
      const page = pageOverride ?? receiptsPager.page
      const pageSize = pageSizeOverride ?? receiptsPager.pageSize
      const result = await listBankReceipts({
        q: filters.q.trim() || undefined,
        status: filters.status || undefined,
        customer_id: filters.customer.trim() || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      setReceipts(result.items)
      receiptsPager.setTotal(result.total)
      setReceiptTotals({
        totalAmount: result.total_amount,
        unallocatedAmount: result.unallocated_amount,
        currency: result.currency,
      })
      const nextReceiptId =
        preferredId ??
        (activeModule === 'receipts' && result.items.some((item) => item.id === detailId)
          ? detailId
          : null) ??
        (result.items.some((item) => item.id === selectedReceiptId) ? selectedReceiptId : null) ??
        result.items[0]?.id ??
        null
      setSelectedReceiptId(nextReceiptId)
    } catch (caught) {
      showError(caught, t('finance.receipt.message.loadReceiptsFailed'))
    } finally {
      setLoadingReceipts(false)
    }
  }

  async function loadReceivables(
    pageOverride?: number,
    pageSizeOverride?: number,
    filtersOverride?: ReceivableFilters,
  ) {
    setLoadingReceivables(true)
    setError('')
    try {
      const filters = filtersOverride ?? receivableFilters
      const page = pageOverride ?? receivablesPager.page
      const pageSize = pageSizeOverride ?? receivablesPager.pageSize
      const result = await listReceivables({
        q: filters.q.trim() || undefined,
        contract_no: filters.contract.trim() || undefined,
        invoice_no: filters.invoice.trim() || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      setReceivables(result.items)
      receivablesPager.setTotal(result.total)
      setReceivableTotal(result.total_receivable_amount)
    } catch (caught) {
      showError(caught, t('finance.receipt.message.loadReceivablesFailed'))
    } finally {
      setLoadingReceivables(false)
    }
  }

  async function submitReceipt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmittingReceipt(true)
    setMessage('')
    setError('')
    try {
      const created = await createBankReceipt(bankReceiptPayload(receiptForm))
      setMessage(t('finance.receipt.message.receiptCreated', { code: created.receipt_no }))
      setReceiptForm(initialBankReceiptForm())
      await loadReceipts(created.id, 1, receiptsPager.pageSize)
    } catch (caught) {
      showError(caught, t('finance.receipt.message.receiptCreateFailed'))
    } finally {
      setSubmittingReceipt(false)
    }
  }

  async function submitClaim(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedReceipt) return
    setSubmittingClaim(true)
    setMessage('')
    setError('')
    try {
      const claimed = await claimBankReceipt(selectedReceipt.id, receiptClaimPayload(claimForm))
      setMessage(t('finance.receipt.message.receiptClaimed', { code: claimed.receipt_no }))
      setClaimForm(initialReceiptClaimForm())
      setReceipts((current) => current.map((item) => (item.id === claimed.id ? claimed : item)))
      setSelectedReceiptId(claimed.id)
      await loadReceipts(claimed.id)
    } catch (caught) {
      showError(caught, t('finance.receipt.message.receiptClaimFailed'))
    } finally {
      setSubmittingClaim(false)
    }
  }

  async function submitAllocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedReceipt) return
    setSubmittingAllocation(true)
    setMessage('')
    setError('')
    try {
      const allocated = await allocateBankReceipt(
        selectedReceipt.id,
        receiptAllocationPayload(allocationForm),
      )
      setMessage(t('finance.receipt.message.receiptAllocated', { code: allocated.receipt_no }))
      setAllocationForm(initialReceiptAllocationForm(allocated.currency))
      setReceipts((current) => current.map((item) => (item.id === allocated.id ? allocated : item)))
      setSelectedReceiptId(allocated.id)
      await loadReceipts(allocated.id)
      await loadReceivables()
    } catch (caught) {
      showError(caught, t('finance.receipt.message.receiptAllocationFailed'))
    } finally {
      setSubmittingAllocation(false)
    }
  }

  async function changeReceiptsPage(nextPage: number, nextPageSize: number) {
    const next = receiptsPager.changePage(nextPage, nextPageSize)
    const nextSearch = urlQuery.update({
      receipts_page: next.page === 1 ? null : next.page,
      receipts_q: receiptFilters.q,
      receipts_status: receiptFilters.status,
      receipts_customer: receiptFilters.customer,
    })
    appliedReceiptsSignatureRef.current = receiptSignature(new URLSearchParams(nextSearch))
    await loadReceipts(undefined, next.page, next.pageSize, receiptFilters)
  }

  async function changeReceivablesPage(nextPage: number, nextPageSize: number) {
    const next = receivablesPager.changePage(nextPage, nextPageSize)
    const nextSearch = urlQuery.update({
      receivables_page: next.page === 1 ? null : next.page,
      receivables_q: receivableFilters.q,
      receivables_contract: receivableFilters.contract,
      receivables_invoice: receivableFilters.invoice,
    })
    appliedReceivablesSignatureRef.current = receivableSignature(new URLSearchParams(nextSearch))
    await loadReceivables(next.page, next.pageSize, receivableFilters)
  }

  useEffect(() => {
    const signature = receiptSignature(urlQuery.params)
    if (appliedReceiptsSignatureRef.current === signature) return
    appliedReceiptsSignatureRef.current = signature
    const filters = receiptFiltersFromParams(urlQuery.params)
    const nextPage = parsePageParam(urlQuery.params, 'receipts_page')
    setReceiptFilters(filters)
    receiptsPager.setPage(nextPage)
    void loadReceipts(undefined, nextPage, receiptsPager.pageSize, filters)
  }, [urlQuery.search])

  useEffect(() => {
    const signature = receivableSignature(urlQuery.params)
    if (appliedReceivablesSignatureRef.current === signature) return
    appliedReceivablesSignatureRef.current = signature
    const filters = receivableFiltersFromParams(urlQuery.params)
    const nextPage = parsePageParam(urlQuery.params, 'receivables_page')
    setReceivableFilters(filters)
    receivablesPager.setPage(nextPage)
    void loadReceivables(nextPage, receivablesPager.pageSize, filters)
  }, [urlQuery.search])

  const totalReceiptAmount = receiptTotals.totalAmount

  const totalUnallocatedAmount = receiptTotals.unallocatedAmount

  const receiptCurrency = receiptTotals.currency

  const totalReceivableAmount = receivableTotal

  const selectedReceiptCanClaim = selectedReceipt?.status === 'unclaimed'

  const selectedReceiptCanAllocate = selectedReceipt
    ? selectedReceipt.status !== 'unclaimed' && Number(selectedReceipt.unallocated_amount) > 0
    : false

  return {
    allocationForm,
    changeReceiptsPage,
    changeReceivablesPage,
    claimForm,
    loadReceipts,
    loadReceivables,
    loadingReceipts,
    loadingReceivables,
    receiptCurrency,
    receiptsPagination: receiptsPager.pagination,
    receiptsTotal: receiptsPager.total,
    receivablesPagination: receivablesPager.pagination,
    receivablesTotal: receivablesPager.total,
    totalReceivableAmount,
    receiptCustomerFilter: receiptFilters.customer,
    receiptForm,
    receiptModalOpen,
    receiptSearch: receiptFilters.q,
    receiptStatusFilter: receiptFilters.status,
    receipts,
    receivableContractFilter: receivableFilters.contract,
    receivableInvoiceFilter: receivableFilters.invoice,
    receivableSearch: receivableFilters.q,
    receivables,
    selectedReceipt,
    selectedReceiptCanAllocate,
    selectedReceiptCanClaim,
    setAllocationForm,
    setClaimForm,
    setReceiptCustomerFilter: (value: string) =>
      setReceiptFilters((current) => ({ ...current, customer: value })),
    setReceiptForm,
    setReceiptModalOpen,
    setReceiptSearch: (value: string) =>
      setReceiptFilters((current) => ({ ...current, q: value })),
    setReceiptStatusFilter: (value: string) =>
      setReceiptFilters((current) => ({ ...current, status: value })),
    setReceivableContractFilter: (value: string) =>
      setReceivableFilters((current) => ({ ...current, contract: value })),
    setReceivableInvoiceFilter: (value: string) =>
      setReceivableFilters((current) => ({ ...current, invoice: value })),
    setReceivableSearch: (value: string) =>
      setReceivableFilters((current) => ({ ...current, q: value })),
    setSelectedReceiptId,
    submitAllocation,
    submitClaim,
    submitReceipt,
    submittingAllocation,
    submittingClaim,
    submittingReceipt,
    totalReceiptAmount,
    totalUnallocatedAmount,
  }
}

export type ReceiptsModel = ReturnType<typeof useReceiptsModule>
