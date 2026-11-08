import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

vi.mock('@/api', () => ({
  approveOutboundOrder: vi.fn(),
  cancelOutboundOrder: vi.fn(),
  generateOutboundOrderFromPlan: vi.fn(),
  listOutboundOrders: vi.fn().mockResolvedValue({
    items: [],
    total: 0,
    summary: {
      draft_count: 0,
      submitted_count: 0,
      approved_count: 0,
      outbound_quantity: '0',
    },
  }),
  submitOutboundOrder: vi.fn(),
  listOutboundPlans: vi.fn().mockResolvedValue({
    items: [],
    total: 0,
    summary: { planned_count: 0, scheduled_count: 0, total_quantity: '0', shipment_source_count: 0 },
  }),
  listInventoryBalances: vi.fn().mockResolvedValue({
    items: [],
    total: 0,
    summary: { available_quantity: '0', pending_inspection_quantity: '0' },
  }),
  listInventoryLedgers: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  listAssignableUsers: vi.fn().mockResolvedValue({ users: [] }),
}))

vi.mock('@/shared/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/ui')>()
  return {
    ...actual,
    Metric: ({ label, value }: { label: string; value: unknown }) =>
      React.createElement('span', { 'data-testid': 'metric' }, `${label}: ${value}`),
  }
})

import { OutboundOrdersPage } from '@/app/pages/warehouse/OutboundOrdersPage'
import { listOutboundOrders, type OutboundOrder } from '@/api'

const orderFixture: OutboundOrder = {
  id: 'outbound-order-1',
  code: 'OO-TEST-001',
  plan_id: 'outbound-plan-1',
  source_type: 'shipment_plan',
  source_id: 'shipment-1',
  source_code: 'SP-TEST-001',
  outbound_type: 'finished_goods_outbound',
  customer_id: 'customer-1',
  customer_name: '第一客户',
  outbound_mode: 'formal',
  outbound_at: '2026-09-02',
  warehouse_id: 'wh-company',
  warehouse_name: '公司仓库',
  location_id: 'loc-a-01',
  location_name: 'A-01',
  operator_name: '仓库主管',
  status: 'draft',
  exception_reason: null,
  submitted_at: null,
  approved_at: null,
  reviewer_id: null,
  reviewer_name: null,
  owner_user_id: 'user-warehouse',
  lines: [],
}

const summaryFixture = {
  draft_count: 3,
  submitted_count: 2,
  approved_count: 1,
  outbound_quantity: '12.00',
}

function metricTexts(): string[] {
  return screen.getAllByTestId('metric').map((element) => element.textContent ?? '')
}

describe('OutboundOrdersPage', () => {
  const onNavigate = vi.fn()
  const currentUser = {
    id: 'u-admin',
    username: 'admin',
    display_name: '管理员',
    department_name: '管理部',
    avatar_type: 'preset' as const,
    avatar_value: 'blue',
    roles: ['admin'],
    permissions: ['system:super_admin'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, '', '/warehouse/outbound-orders')
    vi.mocked(listOutboundOrders).mockResolvedValue({
      items: [orderFixture],
      total: 120,
      summary: summaryFixture,
    })
  })

  it('renders without crashing', () => {
    const { container } = render(
      <OutboundOrdersPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders summary strip with outbound order metrics', () => {
    render(<OutboundOrdersPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByLabelText('货物出库概览')).toBeTruthy()
  })

  it('renders filter inputs', () => {
    render(<OutboundOrdersPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByPlaceholderText('出库单 / 来源单 / 商品')).toBeTruthy()
    expect(screen.getByPlaceholderText('输入客户编号或名称')).toBeTruthy()
    expect(screen.getByPlaceholderText('输入出货单号')).toBeTruthy()
  })

  it('requests the first page with the default page size', async () => {
    render(<OutboundOrdersPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    await waitFor(() =>
      expect(listOutboundOrders).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50, offset: 0 }),
      ),
    )
  })

  it('keeps summary metrics unchanged when switching pages', async () => {
    const user = userEvent.setup()
    render(<OutboundOrdersPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(screen.getByText('OO-TEST-001')).toBeTruthy())
    const before = metricTexts()

    await user.click(screen.getByTitle('2'))

    await waitFor(() =>
      expect(listOutboundOrders).toHaveBeenLastCalledWith(
        expect.objectContaining({ limit: 50, offset: 50 }),
      ),
    )
    expect(metricTexts()).toEqual(before)
  })

  it('opens modal when 生成/审批出库单 button is clicked', async () => {
    const user = userEvent.setup()
    render(<OutboundOrdersPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    const openButton = screen.getByText('生成/审批出库单')
    await user.click(openButton)
    expect(screen.getByText('出库单生成和审批')).toBeTruthy()
    expect(screen.getByPlaceholderText('系统自动生成')).toHaveAttribute('readonly')
  })

  it('renders without detail view when no detailId', () => {
    render(<OutboundOrdersPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    expect(screen.queryByText('出库明细和库存流水')).toBeFalsy()
  })
})
