import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

vi.mock('@/api', () => ({
  generateInboundPlanFromPurchaseContract: vi.fn(),
  listInboundPlans: vi.fn().mockResolvedValue({
    items: [],
    total: 0,
    summary: { planned_count: 0, scheduled_count: 0, total_quantity: '0', type_count: 0 },
  }),
  listPurchaseContracts: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  listSuppliers: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  listAssignableUsers: vi.fn().mockResolvedValue({ users: [] }),
  scheduleInboundPlan: vi.fn(),
}))

vi.mock('@/shared/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/ui')>()
  return {
    ...actual,
    Metric: ({ label, value }: { label: string; value: unknown }) =>
      React.createElement('span', { 'data-testid': 'metric' }, `${label}: ${value}`),
  }
})

import { InboundPlansPage } from '@/app/pages/warehouse/InboundPlansPage'
import { listInboundPlans, type InboundPlan } from '@/api'

const planFixture: InboundPlan = {
  id: 'inbound-plan-1',
  code: 'IP-TEST-001',
  purchase_contract_id: 'purchase-contract-1',
  purchase_contract_no: 'PC-TEST-001',
  supplier_id: 'supplier-1',
  supplier_name: '第一供应商',
  inbound_type: 'purchase_inbound',
  planned_date: '2026-09-01',
  status: 'planned',
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
  type_count: 2,
}

function metricTexts(): string[] {
  return screen.getAllByTestId('metric').map((element) => element.textContent ?? '')
}

describe('InboundPlansPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, '', '/warehouse/inbound-plans')
    vi.mocked(listInboundPlans).mockResolvedValue({
      items: [planFixture],
      total: 120,
      summary: summaryFixture,
    })
  })

  it('renders without crashing', () => {
    const { container } = render(<InboundPlansPage detailId={null} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders summary strip with inbound plan metrics', () => {
    render(<InboundPlansPage detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByLabelText('入库计划概览')).toBeTruthy()
  })

  it('renders search panel title', () => {
    render(<InboundPlansPage detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByText('待入库计划')).toBeTruthy()
  })

  it('renders filter inputs', () => {
    render(<InboundPlansPage detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByPlaceholderText('计划号 / 采购合同 / 商品')).toBeTruthy()
    expect(screen.getByRole('combobox', { name: '供应商筛选' })).toBeTruthy()
    expect(screen.getByPlaceholderText('输入采购合同号')).toBeTruthy()
  })

  it('requests the first page with the default page size', async () => {
    render(<InboundPlansPage detailId={null} onNavigate={onNavigate} />)
    await waitFor(() =>
      expect(listInboundPlans).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50, offset: 0 }),
      ),
    )
  })

  it('keeps summary metrics unchanged when switching pages', async () => {
    const user = userEvent.setup()
    render(<InboundPlansPage detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(screen.getByText('IP-TEST-001')).toBeTruthy())
    const before = metricTexts()

    await user.click(screen.getByTitle('2'))

    await waitFor(() =>
      expect(listInboundPlans).toHaveBeenLastCalledWith(
        expect.objectContaining({ limit: 50, offset: 50 }),
      ),
    )
    expect(metricTexts()).toEqual(before)
  })

  it('opens modal when generate/schedule button is clicked', async () => {
    const user = userEvent.setup()
    render(<InboundPlansPage detailId={null} onNavigate={onNavigate} />)
    expect(screen.queryByText('计划生成和排库位')).toBeFalsy()

    await user.click(screen.getByRole('button', { name: '生成/排库位' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByLabelText('采购合同')).toHaveAttribute('role', 'combobox')
    expect(within(dialog).queryByLabelText('采购合同 ID')).not.toBeInTheDocument()
  })

  it('resets the schedule form after cancelling the modal', async () => {
    const user = userEvent.setup()
    const { container } = render(<InboundPlansPage detailId={null} onNavigate={onNavigate} />)

    await user.click(screen.getByRole('button', { name: '生成/排库位' }))
    const operatorInput = screen.getByLabelText('经办人')
    const initialOperator = (operatorInput as HTMLInputElement).value
    await user.clear(operatorInput)
    await user.type(operatorInput, '临时操作员')
    expect(operatorInput).toHaveValue('临时操作员')

    await user.click(container.querySelector('.ant-modal-close') as HTMLElement)
    await user.click(screen.getByRole('button', { name: '生成/排库位' }))

    expect(screen.getByLabelText('经办人')).toHaveValue(initialOperator)
  })

  it('renders without detail view when no detailId', () => {
    render(<InboundPlansPage detailId={null} onNavigate={onNavigate} />)
    // Should not have the "计划明细" detail panel in list-only mode
    expect(screen.queryByText('计划明细')).toBeFalsy()
  })
})
