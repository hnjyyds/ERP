import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import {
  allocateBankReceipt,
  claimBankReceipt,
  createBankReceipt,
  listBankReceipts,
  listReceivables,
  type BankReceipt,
  type ReceivableItem,
} from '../../../../api'
import { showError } from '../../../../shared/errors'
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
} from '../financeHelpers'

import type { FinanceModuleEnv } from '../financePageTypes'

export function useReceiptsModule(env: FinanceModuleEnv) {
  const { activeModule, detailId, setMessage, setError } = env

  const [receipts, setReceipts] = useState<BankReceipt[]>([])

  const [receivables, setReceivables] = useState<ReceivableItem[]>([])

  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null)

  const [receiptSearch, setReceiptSearch] = useState('')

  const [receiptStatusFilter, setReceiptStatusFilter] = useState('')

  const [receiptCustomerFilter, setReceiptCustomerFilter] = useState('')

  const [receivableSearch, setReceivableSearch] = useState('')

  const [receivableContractFilter, setReceivableContractFilter] = useState('')

  const [receivableInvoiceFilter, setReceivableInvoiceFilter] = useState('')

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

  async function loadReceipts(preferredId?: string) {
    setLoadingReceipts(true)
    setError('')
    try {
      const result = await listBankReceipts({
        q: receiptSearch.trim() || undefined,
        status: receiptStatusFilter || undefined,
        customer_id: receiptCustomerFilter.trim() || undefined,
      })
      setReceipts(result.items)
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
      showError(caught, '银行水单加载失败')
    } finally {
      setLoadingReceipts(false)
    }
  }

  async function loadReceivables() {
    setLoadingReceivables(true)
    setError('')
    try {
      const result = await listReceivables({
        q: receivableSearch.trim() || undefined,
        contract_no: receivableContractFilter.trim() || undefined,
        invoice_no: receivableInvoiceFilter.trim() || undefined,
      })
      setReceivables(result.items)
    } catch (caught) {
      showError(caught, '应收账款加载失败')
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
      setMessage(`已录入银行水单 ${created.receipt_no}`)
      setReceiptForm(initialBankReceiptForm())
      await loadReceipts(created.id)
    } catch (caught) {
      showError(caught, '银行水单录入失败')
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
      setMessage(`已认领银行水单 ${claimed.receipt_no}`)
      setClaimForm(initialReceiptClaimForm())
      setReceipts((current) => current.map((item) => (item.id === claimed.id ? claimed : item)))
      setSelectedReceiptId(claimed.id)
      await loadReceipts(claimed.id)
    } catch (caught) {
      showError(caught, '银行水单认领失败')
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
      setMessage(`已分摊银行水单 ${allocated.receipt_no}`)
      setAllocationForm(initialReceiptAllocationForm(allocated.currency))
      setReceipts((current) => current.map((item) => (item.id === allocated.id ? allocated : item)))
      setSelectedReceiptId(allocated.id)
      await loadReceipts(allocated.id)
      await loadReceivables()
    } catch (caught) {
      showError(caught, '收款分摊失败')
    } finally {
      setSubmittingAllocation(false)
    }
  }

  const totalReceiptAmount = receipts.reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const totalUnallocatedAmount = receipts.reduce(
    (sum, item) => sum + Number(item.unallocated_amount || 0),
    0,
  )

  const selectedReceiptCanClaim = selectedReceipt?.status === 'unclaimed'

  const selectedReceiptCanAllocate = selectedReceipt
    ? selectedReceipt.status !== 'unclaimed' && Number(selectedReceipt.unallocated_amount) > 0
    : false

  return {
    allocationForm,
    claimForm,
    loadReceipts,
    loadReceivables,
    loadingReceipts,
    loadingReceivables,
    receiptCustomerFilter,
    receiptForm,
    receiptModalOpen,
    receiptSearch,
    receiptStatusFilter,
    receipts,
    receivableContractFilter,
    receivableInvoiceFilter,
    receivableSearch,
    receivables,
    selectedReceipt,
    selectedReceiptCanAllocate,
    selectedReceiptCanClaim,
    setAllocationForm,
    setClaimForm,
    setReceiptCustomerFilter,
    setReceiptForm,
    setReceiptModalOpen,
    setReceiptSearch,
    setReceiptStatusFilter,
    setReceivableContractFilter,
    setReceivableInvoiceFilter,
    setReceivableSearch,
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
