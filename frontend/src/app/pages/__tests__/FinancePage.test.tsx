import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FinancePage } from '@/app/pages/finance/FinancePage'
import * as api from '@/api'
import type {
  BankReceipt,
  CurrentUser,
  ReceivableItem,
  SupplierInvoice,
  SupplierPaymentRequest,
} from '@/api'

const currentUser: CurrentUser = {
  id: 'u-finance',
  username: 'finance',
  display_name: '演示财务',
  department_name: '财务部',
  avatar_type: 'preset',
  avatar_value: 'sage-pulse',
  roles: ['finance'],
  permissions: ['finance:view'],
}

describe('FinancePage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, '', '/finance/receipts')
  })

  it('renders without crashing (home view)', () => {
    const { container } = render(
      <FinancePage currentUser={currentUser} view={{ module: 'home', id: null }} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders overview view', () => {
    const { container } = render(
      <FinancePage currentUser={currentUser} view={{ module: 'overview', id: null }} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders receipts view', () => {
    const { container } = render(
      <FinancePage currentUser={currentUser} view={{ module: 'receipts', id: null }} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders payments view', () => {
    const { container } = render(
      <FinancePage currentUser={currentUser} view={{ module: 'payments', id: null }} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })

  it('keeps tax document filters and actions in the shared desktop toolbar', () => {
    render(
      <FinancePage currentUser={currentUser} view={{ module: 'tax', id: null }} onNavigate={onNavigate} />,
    )

    expect(screen.getByRole('form', { name: '核销单筛选' })).toHaveClass(
      'single-line-filter-toolbar',
    )
  })

  it('keeps report filters and actions in the shared desktop toolbar', () => {
    render(
      <FinancePage currentUser={currentUser} view={{ module: 'reports', id: null }} onNavigate={onNavigate} />,
    )

    expect(screen.getByRole('form', { name: '财务报表筛选' })).toHaveClass(
      'single-line-filter-toolbar',
    )
  })

  it('keeps the supplier invoice selected by the payment detail route', async () => {
    const invoice = (id: string, invoiceNo: string): SupplierInvoice => ({
      id,
      invoice_no: invoiceNo,
      invoice_date: '2026-08-04',
      supplier_id: 'supplier-1',
      supplier_name: '华东包装制品厂',
      purchase_invoice_notice_id: null,
      purchase_invoice_notice_code: null,
      purchase_contract_id: 'purchase-contract-1',
      purchase_contract_no: 'PC-001',
      total_amount: '3600.00',
      paid_amount: '0.00',
      unpaid_amount: '3600.00',
      currency: 'CNY',
      due_date: '2026-08-20',
      status: 'unpaid',
      remark: null,
      created_by_user_id: 'u-finance',
      created_by_user_name: '演示财务',
      payment_requests: [],
      allocations: [],
    })
    vi.spyOn(api, 'listSupplierInvoices').mockResolvedValue({
      items: [invoice('invoice-first', 'SI-FIRST'), invoice('invoice-target', 'SI-TARGET')],
      total: 2,
    })
    const paymentRequest: SupplierPaymentRequest = {
      id: 'payment-request-target',
      request_no: 'PR-TARGET',
      supplier_invoice_id: 'invoice-target',
      supplier_invoice_no: 'SI-TARGET',
      supplier_id: 'supplier-1',
      supplier_name: '华东包装制品厂',
      purchase_contract_id: 'purchase-contract-1',
      purchase_contract_no: 'PC-001',
      payment_type: 'goods',
      request_date: '2026-08-04',
      requested_amount: '100.00',
      approved_amount: '0.00',
      paid_amount: '0.00',
      currency: 'CNY',
      status: 'submitted',
      requester_user_id: 'u-requester',
      requester_user_name: '采购专员',
      reviewer_id: currentUser.id,
      reviewer_name: currentUser.display_name,
      approved_at: null,
      payment_account: null,
      remark: null,
    }
    vi.spyOn(api, 'listPaymentRequests').mockResolvedValue({
      items: [
        { ...paymentRequest, id: 'payment-request-first', request_no: 'PR-FIRST' },
        paymentRequest,
      ],
      total: 2,
    })

    render(
      <FinancePage
        currentUser={currentUser}
        view={{
          module: 'payments',
          id: 'invoice-target',
          itemId: 'payment-request-target',
        }}
        onNavigate={onNavigate}
      />,
    )

    expect((await screen.findAllByText('SI-TARGET')).length).toBeGreaterThan(0)
    expect(await screen.findByRole('textbox', { name: '审批金额' })).toHaveValue('100.00')
    expect(screen.getByRole('button', { name: '审批付款' })).toBeEnabled()
  })

  it('pages receipts on the server without changing backend summary totals', async () => {
    const receipt: BankReceipt = {
      id: 'receipt-1',
      receipt_no: 'BR-PAGE-001',
      received_at: '2026-08-04',
      payer_name: '华东客户',
      customer_id: 'customer-1',
      customer_name: '华东客户',
      amount: '1200.00',
      allocated_amount: '1200.00',
      unallocated_amount: '0.00',
      currency: 'USD',
      bank_account: '招商银行 **** 8821',
      reference_no: null,
      receipt_type: 'customer_receipt',
      status: 'allocated',
      claim_message: '',
      remark: null,
      created_by_user_id: 'u-finance',
      created_by_user_name: '演示财务',
      claims: [],
      allocations: [],
    }
    const receivable: ReceivableItem = {
      contract_id: 'contract-1',
      contract_no: 'SC-001',
      customer_id: 'customer-1',
      customer_name: '华东客户',
      sales_user_id: 'u-sales',
      sales_user_name: '业务员',
      currency: 'USD',
      total_amount: '1200.00',
      received_amount: '1200.00',
      receivable_amount: '0.00',
      status: 'settled',
    }
    vi.spyOn(api, 'listBankReceipts').mockResolvedValue({
      items: [receipt],
      total: 120,
      total_amount: '1200.00',
      unallocated_amount: '0.00',
      currency: 'USD',
    })
    vi.spyOn(api, 'listReceivables').mockResolvedValue({
      items: [receivable],
      total: 1,
      total_receivable_amount: '0.00',
    })

    render(
      <FinancePage
        currentUser={currentUser}
        view={{ module: 'receipts', id: null }}
        onNavigate={onNavigate}
      />,
    )

    expect(await screen.findByText('BR-PAGE-001')).toBeInTheDocument()
    expect(api.listBankReceipts).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50, offset: 0 }),
    )
    const summaryBefore = screen.getAllByText('USD 1,200.00').length
    expect(summaryBefore).toBeGreaterThan(0)

    fireEvent.click(screen.getByTitle('2'))

    await waitFor(() => {
      expect(api.listBankReceipts).toHaveBeenLastCalledWith(
        expect.objectContaining({ limit: 50, offset: 50 }),
      )
    })
    expect(window.location.search).toContain('receipts_page=2')
    expect(screen.getAllByText('USD 1,200.00').length).toBe(summaryBefore)
  })

  it('restores receipt filters and page from the URL on direct load', async () => {
    window.history.replaceState(
      {},
      '',
      '/finance/receipts?receipts_q=BR-2026&receipts_status=claimed&receipts_page=2',
    )
    vi.spyOn(api, 'listBankReceipts').mockResolvedValue({
      items: [],
      total: 120,
      total_amount: '0.00',
      unallocated_amount: '0.00',
      currency: 'USD',
    })
    vi.spyOn(api, 'listReceivables').mockResolvedValue({
      items: [],
      total: 0,
      total_receivable_amount: '0.00',
    })

    render(
      <FinancePage
        currentUser={currentUser}
        view={{ module: 'receipts', id: null }}
        onNavigate={onNavigate}
      />,
    )

    expect(await screen.findByDisplayValue('BR-2026')).toBeInTheDocument()
    expect(screen.getByTitle('已认领')).toBeInTheDocument()
    expect(api.listBankReceipts).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'BR-2026', status: 'claimed', limit: 50, offset: 50 }),
    )
  })

  it('writes receipt filters to the URL, resets to page 1 and keeps other list keys', async () => {
    window.history.replaceState(
      {},
      '',
      '/finance/receipts?receipts_page=2&payables_q=SI-KEEP&payables_page=3',
    )
    vi.spyOn(api, 'listBankReceipts').mockResolvedValue({
      items: [],
      total: 120,
      total_amount: '0.00',
      unallocated_amount: '0.00',
      currency: 'USD',
    })
    vi.spyOn(api, 'listReceivables').mockResolvedValue({
      items: [],
      total: 0,
      total_receivable_amount: '0.00',
    })

    render(
      <FinancePage
        currentUser={currentUser}
        view={{ module: 'receipts', id: null }}
        onNavigate={onNavigate}
      />,
    )

    const searchInput = await screen.findByLabelText('水单搜索')
    fireEvent.change(searchInput, { target: { value: 'BR-2026' } })
    fireEvent.click(screen.getAllByRole('button', { name: '查询' })[0])

    await waitFor(() => {
      expect(api.listBankReceipts).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: 'BR-2026', limit: 50, offset: 0 }),
      )
    })
    expect(window.location.search).toContain('receipts_q=BR-2026')
    expect(window.location.search).not.toContain('receipts_page=')
    expect(window.location.search).toContain('payables_q=SI-KEEP')
    expect(window.location.search).toContain('payables_page=3')
  })
})
