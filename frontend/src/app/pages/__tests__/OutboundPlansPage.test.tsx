import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

vi.mock('@/api', () => ({
  generateOutboundPlanFromShipment: vi.fn(),
  listOutboundPlans: vi.fn().mockResolvedValue({
    items: [],
    total: 0,
    summary: { planned_count: 0, scheduled_count: 0, total_quantity: '0', shipment_source_count: 0 },
  }),
  scheduleOutboundPlan: vi.fn(),
  listShipments: vi.fn().mockResolvedValue({ items: [], total: 0 }),
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

import { OutboundPlansPage } from '@/app/pages/warehouse/OutboundPlansPage'
import { listOutboundPlans, type OutboundPlan } from '@/api'

const planFixture: OutboundPlan = {
  id: 'outbound-plan-1',
  code: 'OP-TEST-001',
  source_type: 'shipment_plan',
  source_id: 'shipment-1',
  source_code: 'SP-TEST-001',
  outbound_type: 'finished_goods_outbound',
  planned_date: '2026-09-01',
  status: 'planned',
  customer_id: 'customer-1',
  customer_name: '第一客户',
  warehouse_id: 'wh-company',
  warehouse_name: '公司仓库',
  location_id: 'loc-a-01',
  location_name: 'A-01',
  operator_name: '仓库主管',
  owner_user_id: 'user-warehouse',
  lines: [],
}

const summaryFixture = {
  planned_count: 3,
  scheduled_count: 2,
  total_quantity: '12.00',
  shipment_source_count: 1,
}

function metricTexts(): string[] {
  return screen.getAllByTestId('metric').map((element) => element.textContent ?? '')
}

describe('OutboundPlansPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, '', '/warehouse/outbound-plans')
    vi.mocked(listOutboundPlans).mockResolvedValue({
      items: [planFixture],
      total: 120,
      summary: summaryFixture,
    })
  })

  it('renders without crashing', () => {
    const { container } = render(<OutboundPlansPage detailId={null} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders summary strip with outbound plan metrics', () => {
    render(<OutboundPlansPage detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByLabelText('出库计划概览')).toBeTruthy()
  })

  it('renders filter inputs', () => {
    render(<OutboundPlansPage detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByPlaceholderText('计划号 / 来源单 / 商品')).toBeTruthy()
    expect(screen.getByPlaceholderText('输入客户编号或名称')).toBeTruthy()
    expect(screen.getByPlaceholderText('输入出货单号')).toBeTruthy()
  })

  it('requests the first page with the default page size', async () => {
    render(<OutboundPlansPage detailId={null} onNavigate={onNavigate} />)
    await waitFor(() =>
      expect(listOutboundPlans).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50, offset: 0 }),
      ),
    )
  })

  it('keeps summary metrics unchanged when switching pages', async () => {
    const user = userEvent.setup()
    render(<OutboundPlansPage detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(screen.getByText('OP-TEST-001')).toBeTruthy())
    const before = metricTexts()

    await user.click(screen.getByTitle('2'))

    await waitFor(() =>
      expect(listOutboundPlans).toHaveBeenLastCalledWith(
        expect.objectContaining({ limit: 50, offset: 50 }),
      ),
    )
    expect(metricTexts()).toEqual(before)
  })

  it('renders without detail view when no detailId', () => {
    render(<OutboundPlansPage detailId={null} onNavigate={onNavigate} />)
    expect(screen.queryByText('待出库清单')).toBeFalsy()
  })
})
