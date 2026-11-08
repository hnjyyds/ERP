import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
import {
  approveOutboundOrder,
  generateOutboundOrderFromPlan,
  listOutboundOrders,
  type OutboundOrder,
} from '@/api'

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

  const orderWith = (overrides: Partial<OutboundOrder> = {}): OutboundOrder => ({
    ...orderFixture,
    ...overrides,
  })

  const mockOrderList = (order: OutboundOrder) => {
    vi.mocked(listOutboundOrders).mockResolvedValue({
      items: [order],
      total: 1,
      summary: summaryFixture,
    })
  }

  it('从 URL 恢复搜索、状态、模式、类型与页码，并按 offset 请求', async () => {
    window.history.replaceState(
      {},
      '',
      '/warehouse/outbound-orders?q=OO&status=approved&mode=formal&type=finished_goods_outbound&customer=客户A&source_id=SP-1&page=2',
    )
    render(<OutboundOrdersPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => {
      expect(listOutboundOrders).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'OO',
          status: 'approved',
          outbound_mode: 'formal',
          outbound_type: 'finished_goods_outbound',
          customer_id: '客户A',
          source_id: 'SP-1',
          limit: 50,
          offset: 50,
        }),
      )
    })
    expect(screen.getByPlaceholderText('出库单 / 来源单 / 商品')).toHaveValue('OO')
    expect(screen.getByLabelText(/单据状态/).closest('.ant-select')?.textContent).toContain(
      '已出库',
    )
    expect(screen.getByLabelText(/出库模式/).closest('.ant-select')?.textContent).toContain(
      '正式出库',
    )

    window.history.pushState(
      {},
      '',
      '/warehouse/outbound-orders?q=OO2&status=draft&mode=exception&type=processing_outbound&customer=客户B&source_id=SP-2&page=1',
    )
    window.dispatchEvent(new PopStateEvent('popstate'))

    await waitFor(() => {
      expect(listOutboundOrders).toHaveBeenLastCalledWith(
        expect.objectContaining({
          q: 'OO2',
          status: 'draft',
          outbound_mode: 'exception',
          outbound_type: 'processing_outbound',
          customer_id: '客户B',
          source_id: 'SP-2',
          offset: 0,
        }),
      )
    })
    expect(screen.getByPlaceholderText('出库单 / 来源单 / 商品')).toHaveValue('OO2')
    expect(screen.getByLabelText(/出库模式/).closest('.ant-select')?.textContent).toContain(
      '异常出库',
    )
  })

  it('提交筛选时写入 URL 并回到第一页', async () => {
    window.history.replaceState({}, '', '/warehouse/outbound-orders?page=3')
    const user = userEvent.setup()
    render(<OutboundOrdersPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => {
      expect(listOutboundOrders).toHaveBeenCalledWith(expect.objectContaining({ offset: 100 }))
    })

    await user.type(screen.getByPlaceholderText('出库单 / 来源单 / 商品'), 'OO-2')
    await user.click(screen.getByLabelText(/单据状态/))
    const approvedOptions = await screen.findAllByText('已出库')
    await user.click(
      approvedOptions.find((element) =>
        element.classList.contains('ant-select-item-option-content'),
      )!,
    )
    await user.click(screen.getByRole('button', { name: '查询' }))

    await waitFor(() => {
      expect(listOutboundOrders).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: 'OO-2', status: 'approved', limit: 50, offset: 0 }),
      )
    })
    const query = new URLSearchParams(window.location.search)
    expect(query.get('q')).toBe('OO-2')
    expect(query.get('status')).toBe('approved')
    expect(query.get('page')).toBeNull()
    expect(screen.getByTitle('1')).toHaveClass('ant-pagination-item-active')
  })

  it('关闭后重新打开弹窗时表单回到当前订单的值', async () => {
    const user = userEvent.setup()
    mockOrderList(orderWith())
    render(<OutboundOrdersPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => expect(screen.getByText('OO-TEST-001')).toBeTruthy())
    await user.click(screen.getByText('生成/审批出库单'))

    const modal = within(screen.getByRole('dialog'))
    const dateInput = modal.getByLabelText('出库日期')
    const locationInput = modal.getByLabelText('库位')
    expect(dateInput).toHaveValue('2026-09-02')
    expect(locationInput).toHaveValue('A-01')

    fireEvent.change(dateInput, { target: { value: '2026-09-09' } })
    fireEvent.change(locationInput, { target: { value: 'B-02' } })
    expect(locationInput).toHaveValue('B-02')

    await user.click(modal.getAllByLabelText('Close')[0])
    await user.click(screen.getByText('生成/审批出库单'))

    expect(modal.getByLabelText('出库日期')).toHaveValue('2026-09-02')
    expect(modal.getByLabelText('库位')).toHaveValue('A-01')
  })

  it('生成出库单失败时保留弹窗内已填写的库位与经办人', async () => {
    const user = userEvent.setup()
    mockOrderList(orderWith())
    vi.mocked(generateOutboundOrderFromPlan).mockRejectedValueOnce(new Error('boom'))
    render(<OutboundOrdersPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => expect(screen.getByText('OO-TEST-001')).toBeTruthy())
    await user.click(screen.getByText('生成/审批出库单'))

    const modal = within(screen.getByRole('dialog'))
    fireEvent.change(modal.getByLabelText('库位'), { target: { value: 'C-03' } })
    fireEvent.change(modal.getByLabelText('经办人'), { target: { value: '张三' } })

    await user.click(modal.getByRole('button', { name: '生成出库单' }))

    await waitFor(() => expect(generateOutboundOrderFromPlan).toHaveBeenCalledTimes(1))
    expect(modal.getByLabelText('库位')).toHaveValue('C-03')
    expect(modal.getByLabelText('经办人')).toHaveValue('张三')
  })

  it('待审批单的审批人不是当前用户时按钮禁用，指定审批人时可提交审批', async () => {
    const warehouseUser = {
      ...currentUser,
      id: 'user-warehouse',
      roles: ['warehouse'],
      permissions: [],
    }
    mockOrderList(
      orderWith({ status: 'submitted', reviewer_id: 'user-manager', reviewer_name: '演示业务主管' }),
    )
    const first = render(
      <OutboundOrdersPage currentUser={warehouseUser} detailId={null} onNavigate={onNavigate} />,
    )

    await waitFor(() => expect(screen.getByText('OO-TEST-001')).toBeTruthy())
    await userEvent.setup().click(screen.getByText('生成/审批出库单'))

    expect(screen.getByRole('button', { name: '审批出库' })).toBeDisabled()
    expect(screen.getByText('等待 演示业务主管 审批')).toBeTruthy()
    first.unmount()

    mockOrderList(
      orderWith({ status: 'submitted', reviewer_id: 'user-warehouse', reviewer_name: '仓库主管' }),
    )
    vi.mocked(approveOutboundOrder).mockResolvedValue(
      orderWith({ status: 'approved', reviewer_id: 'user-warehouse', reviewer_name: '仓库主管' }),
    )
    render(<OutboundOrdersPage currentUser={warehouseUser} detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(screen.getByText('OO-TEST-001')).toBeTruthy())
    await userEvent.setup().click(screen.getByText('生成/审批出库单'))

    const approveButton = screen.getByRole('button', { name: '审批出库' })
    expect(approveButton).toBeEnabled()
    await userEvent.setup().click(approveButton)

    await waitFor(() => {
      expect(approveOutboundOrder).toHaveBeenCalledWith('outbound-order-1', {
        reviewer_name: '仓库主管',
        approved_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        allow_negative: false,
      })
    })
  })
})
