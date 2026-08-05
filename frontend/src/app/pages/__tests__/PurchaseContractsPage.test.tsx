import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as api from '../../../api'
import { PurchaseContractsPage } from '../purchase/PurchaseContractsPage'

describe('PurchaseContractsPage', () => {
  const onNavigate = vi.fn()
  const currentUser = { id: 'u-admin', username: 'admin', display_name: '管理员', department_name: '管理部', avatar_type: 'preset' as const, avatar_value: 'blue', roles: ['admin'], permissions: ['system:super_admin'] }

  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing', () => {
    const { container } = render(<PurchaseContractsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders purchase contract summary', () => {
    render(<PurchaseContractsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    expect(screen.getAllByText('采购合同').length).toBeGreaterThanOrEqual(1)
  })

  it('lets the designated reviewer approve or reject a submitted contract', async () => {
    const user = userEvent.setup()
    const contract: api.PurchaseContract = {
      id: 'pc-review',
      code: 'PC-REVIEW',
      contract_date: '2026-08-04',
      supplier_id: 'supplier-pack-a',
      supplier_name: '华东包装制品厂',
      buyer_user_id: 'u-001',
      buyer_user_name: '演示业务主管',
      qc_user_id: 'u-qc',
      qc_user_name: '演示 QC 专员',
      currency: 'USD',
      delivery_date: '2026-08-30',
      payment_terms: '30% 预付，70% 出货前',
      source_type: 'stock_purchase',
      remarks: null,
      approval_status: 'submitted',
      submitted_at: '2026-08-04',
      approved_at: null,
      rejected_at: null,
      rejection_reason: null,
      reviewer_id: 'u-admin',
      reviewer_name: '管理员',
      owner_user_id: 'u-001',
      statistics: {
        total_quantity: '100',
        total_amount: '1200.00',
        received_quantity: '0',
        unreceived_quantity: '100',
        paid_amount: '0',
        unpaid_amount: '1200.00',
      },
      lines: [],
      source_links: [],
      reminders: [],
    }
    vi.spyOn(api, 'listPurchaseContracts').mockResolvedValue({ items: [contract], total: 1 })
    vi.spyOn(api, 'listPurchaseContractReminders').mockResolvedValue({ items: [], total: 0 })
    vi.spyOn(api, 'listProducts').mockResolvedValue({ items: [], total: 0 })
    vi.spyOn(api, 'listSuppliers').mockResolvedValue({ items: [], total: 0 })
    vi.spyOn(api, 'listAssignableUsers').mockResolvedValue({ users: [] })

    render(
      <PurchaseContractsPage
        currentUser={currentUser}
        detailId="pc-review"
        onNavigate={onNavigate}
      />,
    )

    await user.click(await screen.findByRole('button', { name: '审批采购合同' }))
    const dialog = await screen.findByRole('dialog', { name: '审批采购合同' })
    expect(within(dialog).getByRole('button', { name: '通过审批' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: '驳回合同' })).toBeInTheDocument()
    expect(within(dialog).getByLabelText('驳回原因')).toBeRequired()
  })
})
