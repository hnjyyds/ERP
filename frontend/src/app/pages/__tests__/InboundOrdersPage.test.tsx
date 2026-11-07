import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent as _fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api')>()
  return {
    ...actual,
    approveInboundOrder: vi.fn().mockRejectedValue(new Error('stop after payload capture')),
    generateInboundOrderFromPlan: vi.fn().mockRejectedValue(new Error('stop after payload capture')),
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
    listPurchaseContracts: vi.fn().mockResolvedValue({
      items: [
        {
          id: 'purchase-contract-1',
          code: 'PC-TEST-001',
          supplier_id: 'supplier-1',
          supplier_name: '测试供应商',
          contract_date: '2026-08-01',
          delivery_date: '2026-08-30',
        },
      ],
      total: 1,
    }),
  }
})

import { InboundOrdersPage } from '../warehouse/InboundOrdersPage'
import {
  generateInboundOrderFromPlan,
  listAssignableUsers,
  listInboundOrders,
  listInboundPlans,
  listPurchaseContracts,
  submitInboundOrder,
  type CurrentUser,
} from '../../../api'

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
    vi.mocked(listInboundPlans).mockResolvedValue({ items: [], total: 0 })
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

  it('renders business-facing filter controls', async () => {
    render(<InboundOrdersPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByPlaceholderText('入库单 / 采购合同 / 商品')).toBeTruthy()
    const supplierSelect = screen.getByRole('combobox', { name: '供应商筛选' })
    const contractSelect = screen.getByRole('combobox', { name: '采购合同筛选' })
    expect(supplierSelect.closest('label')).toHaveClass('entity-search-filter')
    expect(contractSelect.closest('label')).toHaveClass('entity-search-filter')
    expect(supplierSelect.closest('.ant-select')?.textContent).toContain('输入供应商编号或名称')
    expect(contractSelect.closest('.ant-select')?.textContent).toContain('输入合同号或供应商')
    expect(screen.queryByPlaceholderText('supplier-id')).toBeNull()
    expect(screen.queryByPlaceholderText('purchase-contract-id')).toBeNull()
    await waitFor(() => expect(listPurchaseContracts).toHaveBeenCalled())
  })

  it('submits selected supplier and purchase contract ids to the existing query', async () => {
    const user = userEvent.setup()
    render(<InboundOrdersPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => expect(listPurchaseContracts).toHaveBeenCalled())
    await user.click(screen.getByRole('combobox', { name: '供应商筛选' }))
    const supplierOption = (await screen.findAllByText('测试供应商')).find((element) =>
      element.classList.contains('remote-select-option-title'),
    )
    expect(supplierOption).toBeTruthy()
    await user.click(supplierOption!)

    await waitFor(() => {
      expect(listPurchaseContracts).toHaveBeenCalledWith({
        q: undefined,
        approval_status: 'approved',
        supplier_id: 'supplier-1',
      })
    })

    await user.click(screen.getByRole('combobox', { name: '采购合同筛选' }))
    const contractOption = (await screen.findAllByText('PC-TEST-001')).find((element) =>
      element.classList.contains('remote-select-option-title'),
    )
    expect(contractOption).toBeTruthy()
    await user.click(contractOption!)
    await user.click(screen.getByRole('button', { name: '查询' }))

    await waitFor(() => {
      expect(listInboundOrders).toHaveBeenLastCalledWith(
        expect.objectContaining({
          supplier_id: 'supplier-1',
          purchase_contract_id: 'purchase-contract-1',
        }),
      )
    })
  })

  it('opens modal when 生成/审批入库单 button is clicked', async () => {
    const user = userEvent.setup()
    render(<InboundOrdersPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    const openButton = screen.getByText('生成/审批入库单')
    await user.click(openButton)
    expect(screen.getByText('入库单生成和审批')).toBeTruthy()
  })

  it('selects an inbound plan by purchase order number and submits the linked plan id', async () => {
    vi.mocked(listInboundPlans).mockResolvedValue({
      items: [
        {
          id: 'inbound-plan-2',
          code: 'IP-TEST-002',
          purchase_contract_id: 'purchase-contract-2',
          purchase_contract_no: 'PC-TEST-002',
          supplier_id: 'supplier-2',
          supplier_name: '第二供应商',
          inbound_type: 'purchase',
          planned_date: '2026-09-05',
          status: 'scheduled',
          warehouse_id: 'wh-company',
          warehouse_name: '公司仓库',
          location_id: 'loc-b-01',
          location_name: 'B-01',
          operator_name: '仓库主管',
          owner_user_id: 'user-warehouse',
          lines: [],
        },
      ],
      total: 1,
    })
    const user = userEvent.setup()
    render(<InboundOrdersPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => expect(screen.getByText('IO-TEST-001')).toBeTruthy())
    await user.click(screen.getByText('生成/审批入库单'))

    const modal = within(screen.getByRole('dialog'))
    expect(modal.getByPlaceholderText('系统自动生成')).toHaveAttribute('readonly')
    const purchaseOrderSelect = modal.getByRole('combobox', { name: '采购订单号' })
    expect(purchaseOrderSelect.closest('.ant-select')?.textContent).toContain('PC-TEST-001')

    await user.click(purchaseOrderSelect)
    expect(await screen.findByText('第二供应商 · 入库计划 IP-TEST-002 · 已排库位')).toBeTruthy()
    await user.click(screen.getByText('PC-TEST-002'))

    expect(purchaseOrderSelect.closest('.ant-select')?.textContent).toContain('PC-TEST-002')
    expect(modal.getByLabelText('入库日期')).toHaveValue('2026-09-05')
    await user.click(modal.getByRole('button', { name: '生成入库单' }))

    await waitFor(() => {
      expect(generateInboundOrderFromPlan).toHaveBeenCalledWith(
        expect.objectContaining({ plan_id: 'inbound-plan-2' }),
      )
    })
    expect(vi.mocked(generateInboundOrderFromPlan).mock.calls[0][0]).not.toHaveProperty('code')
  })

  it('shows selected dropdown values and keeps warehouse id in sync', async () => {
    const user = userEvent.setup()
    render(<InboundOrdersPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => expect(screen.getByText('IO-TEST-001')).toBeTruthy())
    await user.click(screen.getByText('生成/审批入库单'))

    const modal = within(screen.getByRole('dialog'))
    const modeSelect = modal.getByRole('combobox', { name: /入库模式/ })
    expect(modeSelect.closest('.ant-select')?.textContent).toContain('待检入库')
    await user.click(modeSelect)
    await user.click(await screen.findByText('正式入库'))
    expect(modeSelect.closest('.ant-select')?.textContent).toContain('正式入库')

    const warehouseSelect = modal.getByRole('combobox', { name: /仓库 公司仓库/ })
    expect(warehouseSelect.closest('.ant-select')?.textContent).toContain('公司仓库')
    await user.click(warehouseSelect)
    await user.click(await screen.findByText('工厂'))
    expect(warehouseSelect.closest('.ant-select')?.textContent).toContain('工厂')
    expect(modal.getByRole('textbox', { name: '仓库 ID' })).toHaveValue('wh-factory')
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
