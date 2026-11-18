import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('供应商发票加载失败显示错误态并可重试', async () => {
    const user = userEvent.setup()
    const invoice: SupplierInvoice = {
      id: 'invoice-retry',
      invoice_no: 'SI-RETRY',
      invoice_date: '2026-11-10',
      supplier_id: 'supplier-1',
      supplier_name: '华东包装制品厂',
      purchase_invoice_notice_id: null,
      purchase_invoice_notice_code: null,
      purchase_contract_id: null,
      purchase_contract_no: null,
      total_amount: '10.00',
      paid_amount: '0.00',
      unpaid_amount: '10.00',
      currency: 'CNY',
      due_date: null,
      status: 'unpaid',
      remark: null,
      created_by_user_id: 'u-finance',
      created_by_user_name: '演示财务',
      payment_requests: [],
      allocations: [],
    }
    const spy = vi
      .spyOn(api, 'listSupplierInvoices')
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValue({ items: [invoice], total: 1 })

    render(
      <FinancePage currentUser={currentUser} view={{ module: 'payments', id: null }} onNavigate={onNavigate} />,
    )

    expect(await screen.findByText('加载失败')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /重\s*试/ }))
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('SI-RETRY')).toBeTruthy()
  })

  it('应付账款加载失败显示独立错误态并可重试', async () => {
    vi.spyOn(api, 'listSupplierInvoices').mockResolvedValue({ items: [], total: 0 })
    const spy = vi
      .spyOn(api, 'listPayables')
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValue({ items: [], total: 0, total_payable_amount: '0' })

    render(
      <FinancePage currentUser={currentUser} view={{ module: 'payments', id: null }} onNavigate={onNavigate} />,
    )

    await waitFor(() => expect(spy).toHaveBeenCalled())
    const panel = screen.getByText('应付账款查询').closest('section') as HTMLElement
    expect(await within(panel).findByText('加载失败')).toBeTruthy()

    fireEvent.click(within(panel).getByRole('button', { name: /重\s*试/ }))
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(within(panel).queryByText('加载失败')).not.toBeInTheDocument())
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
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: '审批金额' })).toHaveValue('100.00'),
    )
    expect(screen.getByRole('button', { name: '审批付款' })).toBeEnabled()
  })

  it('指定跨发票申请时审批区不回填当前发票金额且禁止审批', async () => {
    const invoice = (id: string, invoiceNo: string, unpaid: string): SupplierInvoice => ({
      id,
      invoice_no: invoiceNo,
      invoice_date: '2026-08-04',
      supplier_id: 'supplier-1',
      supplier_name: '华东包装制品厂',
      purchase_invoice_notice_id: null,
      purchase_invoice_notice_code: null,
      purchase_contract_id: 'purchase-contract-1',
      purchase_contract_no: 'PC-001',
      total_amount: '60.00',
      paid_amount: '0.00',
      unpaid_amount: unpaid,
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
      items: [invoice('invoice-b', 'SI-B', '0.00'), invoice('invoice-a', 'SI-A', '60.00')],
      total: 2,
    })
    vi.spyOn(api, 'listPaymentRequests').mockResolvedValue({
      items: [
        {
          id: 'payment-request-a',
          request_no: 'PR-A',
          supplier_invoice_id: 'invoice-a',
          supplier_invoice_no: 'SI-A',
          supplier_id: 'supplier-1',
          supplier_name: '华东包装制品厂',
          purchase_contract_id: 'purchase-contract-1',
          purchase_contract_no: 'PC-001',
          payment_type: 'goods_payment',
          request_date: '2026-08-04',
          requested_amount: '60.00',
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
        },
      ],
      total: 1,
    })

    render(
      <FinancePage
        currentUser={currentUser}
        view={{ module: 'payments', id: 'invoice-b', itemId: 'payment-request-a' }}
        onNavigate={onNavigate}
      />,
    )

    expect((await screen.findAllByText('SI-B')).length).toBeGreaterThan(0)
    await screen.findByText('PR-A')
    // 发票B未付0.00，不得把跨发票申请A的60.00混入审批区。
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: '审批金额' })).toHaveValue(''),
    )
    expect(screen.getByRole('button', { name: '审批付款' })).toBeDisabled()
  })

  it('已审批申请回显保存的审批日期、付款账号与备注', async () => {
    const invoice: SupplierInvoice = {
      id: 'invoice-approved',
      invoice_no: 'SI-APPROVED',
      invoice_date: '2026-11-10',
      supplier_id: 'supplier-1',
      supplier_name: '华东包装制品厂',
      purchase_invoice_notice_id: null,
      purchase_invoice_notice_code: null,
      purchase_contract_id: null,
      purchase_contract_no: null,
      total_amount: '0.01',
      paid_amount: '0.01',
      unpaid_amount: '0.00',
      currency: 'CNY',
      due_date: null,
      status: 'paid',
      remark: null,
      created_by_user_id: 'u-finance',
      created_by_user_name: '演示财务',
      payment_requests: [],
      allocations: [],
    }
    vi.spyOn(api, 'listSupplierInvoices').mockResolvedValue({ items: [invoice], total: 1 })
    vi.spyOn(api, 'listPaymentRequests').mockResolvedValue({
      items: [
        {
          id: 'payment-request-approved',
          request_no: 'PR-APPROVED',
          supplier_invoice_id: invoice.id,
          supplier_invoice_no: invoice.invoice_no,
          supplier_id: 'supplier-1',
          supplier_name: '华东包装制品厂',
          purchase_contract_id: null,
          purchase_contract_no: null,
          payment_type: 'goods_payment',
          request_date: '2026-11-17',
          requested_amount: '0.01',
          approved_amount: '0.01',
          paid_amount: '0.01',
          currency: 'CNY',
          status: 'approved',
          requester_user_id: 'u-requester',
          requester_user_name: '采购专员',
          reviewer_id: currentUser.id,
          reviewer_name: currentUser.display_name,
          approved_at: '2026-11-17',
          payment_account: 'UIQA-TEST-ACCOUNT',
          remark: '已保存的审批备注',
        },
      ],
      total: 1,
    })

    render(
      <FinancePage
        currentUser={currentUser}
        view={{ module: 'payments', id: invoice.id, itemId: 'payment-request-approved' }}
        onNavigate={onNavigate}
      />,
    )

    expect(await screen.findByRole('textbox', { name: '审批金额' })).toBeTruthy()
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: '审批金额' })).toHaveValue('0.01'),
    )
    expect(screen.getByLabelText('审批日期')).toHaveValue('2026-11-17')
    expect(screen.getByRole('textbox', { name: '付款账号' })).toHaveValue('UIQA-TEST-ACCOUNT')
    expect(screen.getByRole('textbox', { name: '审批备注' })).toHaveValue('已保存的审批备注')
    expect(screen.getByRole('button', { name: '审批付款' })).toBeDisabled()
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

  it('收款客户筛选提交 UUID 而不是手输文本', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'listBankReceipts').mockResolvedValue({
      items: [],
      total: 0,
      total_amount: '0.00',
      unallocated_amount: '0.00',
      currency: 'USD',
    })
    vi.spyOn(api, 'listReceivables').mockResolvedValue({
      items: [],
      total: 0,
      total_receivable_amount: '0.00',
    })
    vi.spyOn(api, 'listCustomers').mockResolvedValue({
      items: [
        {
          id: 'customer-uuid-1',
          code: 'QA261112-C01',
          cn_name: '宁波家电',
          en_name: 'Ningbo Appliance',
          status: 'active',
        },
      ],
      total: 1,
      summary: { active_count: 1, contact_count: 0, credit_profile_count: 0 },
    } as never)

    render(
      <FinancePage
        currentUser={currentUser}
        view={{ module: 'receipts', id: null }}
        onNavigate={onNavigate}
      />,
    )

    const customerFilter = await screen.findByRole('combobox', { name: '客户标识' })
    await user.click(customerFilter)
    await user.click(await screen.findByText('宁波家电'))
    const filterForm = customerFilter.closest('form') as HTMLElement
    await user.click(within(filterForm).getByRole('button', { name: '查询' }))

    await waitFor(() => {
      expect(api.listBankReceipts).toHaveBeenLastCalledWith(
        expect.objectContaining({ customer_id: 'customer-uuid-1' }),
      )
    })
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
