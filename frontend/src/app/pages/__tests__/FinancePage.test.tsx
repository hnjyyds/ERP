import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FinancePage } from '../finance/FinancePage'
import * as api from '../../../api'
import type { CurrentUser, SupplierInvoice, SupplierPaymentRequest } from '../../../api'

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

  beforeEach(() => { vi.clearAllMocks() })

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
})
