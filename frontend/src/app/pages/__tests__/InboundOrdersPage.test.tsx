import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent as _fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api')>()
  return {
    ...actual,
    approveInboundOrder: vi.fn().mockRejectedValue(new Error('stop after payload capture')),
    submitInboundOrder: vi.fn().mockRejectedValue(new Error('stop after payload capture')),
    listAssignableUsers: vi.fn().mockResolvedValue({
      users: [
        {
          id: 'user-manager',
          username: 'business_manager',
          display_name: '演示业务主管',
          department_name: '业务部',
          avatar_type: 'preset',
          avatar_value: 'blue-orbit',
        },
      ],
    }),
    listInboundOrders: vi.fn().mockResolvedValue({
      items: [
        {
          id: 'inbound-order-1',
          code: 'IO-TEST-001',
          plan_id: 'inbound-plan-1',
          purchase_contract_id: 'purchase-contract-1',
          purchase_contract_no: 'PC-TEST-001',
          supplier_id: 'supplier-1',
          supplier_name: '测试供应商',
          inbound_type: 'purchase',
          inbound_mode: 'pending_inspection',
          inbound_at: '2026-08-30',
          warehouse_id: 'wh-ningbo',
          warehouse_name: '宁波总仓',
          location_id: 'loc-a-01',
          location_name: 'A-01',
          operator_name: '仓库主管',
          status: 'draft',
          submitted_at: null,
          approved_at: null,
          reviewer_id: null,
          reviewer_name: null,
          owner_user_id: 'user-warehouse',
          lines: [],
        },
      ],
      total: 1,
    }),
    listInboundPlans: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    listInventoryBalances: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    listInventoryLedgers: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  }
})

import { InboundOrdersPage } from '../warehouse/InboundOrdersPage'
import { listAssignableUsers, submitInboundOrder, type CurrentUser } from '../../../api'

describe('InboundOrdersPage', () => {
  const onNavigate = vi.fn()
  const currentUser: CurrentUser = {
    id: 'user-warehouse',
    username: 'warehouse',
    display_name: '仓库主管',
    department_name: '仓储部',
    avatar_type: 'preset',
    avatar_value: 'blue-orbit',
    roles: ['warehouse'],
    permissions: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = render(
      <InboundOrdersPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders summary strip with inbound order metrics', () => {
    render(<InboundOrdersPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByLabelText('货物入库概览')).toBeTruthy()
  })

  it('renders search panel title', () => {
    render(<InboundOrdersPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    // "入库单" appears in metric label, panel title, and table header
    expect(screen.getAllByText('入库单').length).toBeGreaterThan(0)
  })

  it('renders filter inputs', () => {
    render(<InboundOrdersPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByPlaceholderText('入库单 / 采购合同 / 商品')).toBeTruthy()
    expect(screen.getByPlaceholderText('supplier-id')).toBeTruthy()
    expect(screen.getByPlaceholderText('purchase-contract-id')).toBeTruthy()
  })

  it('opens modal when 生成/审批入库单 button is clicked', async () => {
    const user = userEvent.setup()
    render(<InboundOrdersPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    const openButton = screen.getByText('生成/审批入库单')
    await user.click(openButton)
    expect(screen.getByText('入库单生成和审批')).toBeTruthy()
  })

  it('selects an active employee and submits the linked reviewer id', async () => {
    const user = userEvent.setup()
    render(<InboundOrdersPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => expect(screen.getByText('IO-TEST-001')).toBeTruthy())
    await user.click(screen.getByText('生成/审批入库单'))
    await waitFor(() => expect(listAssignableUsers).toHaveBeenCalledTimes(1))

    const reviewerSelect = screen.getByRole('combobox', { name: '审批人' })
    expect(screen.queryByRole('textbox', { name: '审批人' })).toBeNull()
    await user.click(reviewerSelect)
    await user.click(await screen.findByText('演示业务主管 / business_manager / 业务部'))

    await user.click(screen.getByRole('button', { name: '提交审批' }))

    await waitFor(() => {
      expect(submitInboundOrder).toHaveBeenCalledWith(
        'inbound-order-1',
        {
          reviewer_id: 'user-manager',
        },
      )
    })
  })

  it('renders without detail view when no detailId', () => {
    render(<InboundOrdersPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    expect(screen.queryByText('明细和库存')).toBeFalsy()
  })
})
