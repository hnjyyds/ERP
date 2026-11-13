import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as api from '@/api'
import type { ShipmentPlan } from '@/api'
import { ShipmentsPage } from '@/app/pages/sales/ShipmentsPage'

const shipment = {
  id: 's-1',
  code: 'S-001',
  approval_status: 'submitted',
  customer_name: '客户A',
  shipment_date: '2026-08-01',
  planned_ship_date: '2026-08-05',
  finance_overview: {
    receivable_amount: '100.00',
    profit_amount: '20.00',
    profit_rate: '20',
    currency: 'USD',
  },
  contract_progresses: [],
} as unknown as ShipmentPlan

const detailShipment = {
  ...shipment,
  reviewer_id: 'u-other',
  reviewer_name: '张三',
  shipping_method: 'sea',
  port_of_loading: 'Ningbo',
  port_of_destination: 'Hamburg',
  vessel_name: null,
  container_no: null,
  booking_no: null,
  document_owner_name: null,
  currency: 'USD',
  finance_overview: {
    receivable_amount: '100.00',
    payable_amount: '40.00',
    profit_amount: '60.00',
    profit_rate: '60',
    currency: 'USD',
  },
  reminder: {
    shipment_id: 's-1',
    reminder_date: '2026-08-10',
    shipment_no: 'S-001',
    status: 'pending',
    message: '当前提醒内容',
  },
  lines: [],
} as unknown as ShipmentPlan

const emptySummary = {
  submitted_count: 0,
  approved_count: 0,
  receivable_amount: '0',
  profit_amount: '0',
  currency: 'USD',
}

function metricValue(label: string): string | null | undefined {
  const cell = Array.from(document.querySelectorAll('.metric-cell')).find(
    (node) => node.querySelector('.metric-label')?.textContent === label,
  )
  return cell?.querySelector('.metric-value')?.textContent
}

describe('ShipmentsPage', () => {
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
    window.history.replaceState({}, '', '/')
    vi.spyOn(api, 'listShipmentReminders').mockResolvedValue({ items: [], total: 0 })
  })

  it('renders without crashing', () => {
    const { container } = render(
      <ShipmentsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders shipment list panel', () => {
    render(<ShipmentsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByText('出货计划列表')).toBeTruthy()
  })

  it('把查询与生成按钮放在独立操作组内右对齐', () => {
    const { container } = render(
      <ShipmentsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )

    const actions = container.querySelector('.inline-filters > .filter-actions')
    expect(actions).toBeTruthy()
    expect(within(actions as HTMLElement).getByRole('button', { name: '查询' })).toBeTruthy()
    expect(
      within(actions as HTMLElement).getByRole('button', { name: '生成出货明细' }),
    ).toBeTruthy()
  })

  it('uses business-readable selectors for shipment contracts', () => {
    render(<ShipmentsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)

    fireEvent.click(screen.getByRole('button', { name: '生成出货明细' }))

    expect(screen.getByLabelText('出口合同 A')).toHaveAttribute('role', 'combobox')
    expect(screen.getByLabelText('出口合同 B（可选）')).toHaveAttribute('role', 'combobox')
    expect(screen.queryByLabelText('合同标识 A')).not.toBeInTheDocument()
  })

  it('按服务端分页请求且在翻页时保持后端汇总指标不变', async () => {
    const listSpy = vi.spyOn(api, 'listShipments').mockResolvedValue({
      items: [shipment],
      total: 120,
      summary: {
        submitted_count: 3,
        approved_count: 2,
        receivable_amount: '300.00',
        profit_amount: '60.00',
        currency: 'USD',
      },
    })

    render(
      <ShipmentsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ limit: 50, offset: 0 }))
    })
    expect(metricValue('待审批')).toBe('3')
    expect(metricValue('已审批')).toBe('2')

    await userEvent.click(screen.getByTitle('2'))

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ limit: 50, offset: 50 }))
    })
    expect(metricValue('待审批')).toBe('3')
    expect(metricValue('已审批')).toBe('2')
  })

  it('按 URL 恢复筛选条件与页码', async () => {
    window.history.replaceState(
      {},
      '',
      '/sales/shipments?q=S-1&status=submitted&customer=c-1&contract=ec-1&page=2',
    )
    const listSpy = vi.spyOn(api, 'listShipments').mockResolvedValue({
      items: [shipment],
      total: 120,
      summary: emptySummary,
    })

    render(<ShipmentsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'S-1',
          approval_status: 'submitted',
          customer_id: 'c-1',
          contract_id: 'ec-1',
          limit: 50,
          offset: 50,
        }),
      )
    })
  })

  it('翻到空页时回退上一页并清掉 URL 页码', async () => {
    const listSpy = vi
      .spyOn(api, 'listShipments')
      .mockResolvedValueOnce({ items: [shipment], total: 120, summary: emptySummary })
      .mockResolvedValueOnce({ items: [], total: 120, summary: emptySummary })
      .mockResolvedValue({ items: [shipment], total: 120, summary: emptySummary })

    render(<ShipmentsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(listSpy).toHaveBeenCalledTimes(1))

    await userEvent.click(screen.getByTitle('2'))

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ offset: 50 }))
    })
    await waitFor(() => {
      expect(listSpy).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 0 }))
    })
    expect(window.location.search).not.toContain('page=')
  })

  it('详情页展示当前提醒与提醒列表', async () => {
    vi.spyOn(api, 'listShipments').mockResolvedValue({
      items: [detailShipment],
      total: 1,
      summary: emptySummary,
    })
    vi.spyOn(api, 'listShipmentReminders').mockResolvedValue({
      items: [
        {
          shipment_id: 's-1',
          reminder_date: '2026-08-12',
          shipment_no: 'S-001',
          status: 'done',
          message: '列表提醒内容',
        },
      ],
      total: 1,
    })

    render(<ShipmentsPage currentUser={currentUser} detailId="s-1" onNavigate={onNavigate} />)

    expect(await screen.findByText('列表提醒内容')).toBeTruthy()
    expect(screen.getAllByText('当前提醒内容').length).toBeGreaterThan(0)
    expect(screen.getByText('出货提醒列表')).toBeTruthy()
  })

  it('非指定审批人不可审批并提示等待指定人', async () => {
    vi.spyOn(api, 'listShipments').mockResolvedValue({
      items: [detailShipment],
      total: 1,
      summary: emptySummary,
    })

    render(
      <ShipmentsPage
        currentUser={{ ...currentUser, id: 'u-sales', permissions: ['sales:shipment:approve'] }}
        detailId="s-1"
        onNavigate={onNavigate}
      />,
    )

    const approveButton = await screen.findByRole('button', { name: '审批通过' })
    expect(approveButton).toBeDisabled()
    expect(screen.getByText('等待 张三 审批')).toBeTruthy()
  })

  it('指定审批人审批通过后刷新并提示', async () => {
    vi.spyOn(api, 'listShipments').mockResolvedValue({
      items: [{ ...detailShipment, reviewer_id: 'u-sales', reviewer_name: '销售A' }],
      total: 1,
      summary: emptySummary,
    })
    const approveSpy = vi.spyOn(api, 'approveShipment').mockResolvedValue({
      ...detailShipment,
      approval_status: 'approved',
    })

    render(
      <ShipmentsPage
        currentUser={{ ...currentUser, id: 'u-sales', permissions: ['sales:shipment:approve'] }}
        detailId="s-1"
        onNavigate={onNavigate}
      />,
    )

    const approveButton = await screen.findByRole('button', { name: '审批通过' })
    expect(approveButton).toBeEnabled()

    await userEvent.click(approveButton)

    await waitFor(() => expect(approveSpy).toHaveBeenCalledTimes(1))
    expect(approveSpy.mock.calls[0][0]).toBe('s-1')
    expect(approveSpy.mock.calls[0][1]).toMatchObject({ reviewer_name: '销售A' })
    expect(await screen.findByText('已审批出货明细 S-001')).toBeTruthy()
  })

  it('提交人可在已提交状态撤回并刷新', async () => {
    vi.spyOn(api, 'listShipments').mockResolvedValue({
      items: [{ ...detailShipment, owner_user_id: 'u-sales' }],
      total: 1,
      summary: emptySummary,
    })
    const withdrawSpy = vi.spyOn(api, 'withdrawShipment').mockResolvedValue({
      ...detailShipment,
      owner_user_id: 'u-sales',
      approval_status: 'draft',
      submitted_at: null,
      reviewer_id: null,
      reviewer_name: null,
    })

    render(
      <ShipmentsPage
        currentUser={{ ...currentUser, id: 'u-sales', permissions: ['sales:shipment:edit'] }}
        detailId="s-1"
        onNavigate={onNavigate}
      />,
    )

    const withdrawButton = await screen.findByRole('button', { name: /撤\s*回/ })
    expect(withdrawButton).toBeEnabled()

    await userEvent.click(withdrawButton)

    await waitFor(() => expect(withdrawSpy).toHaveBeenCalledWith('s-1'))
    expect(await screen.findByText('已撤回出货明细 S-001')).toBeTruthy()
  })

  it('非提交人且非管理员不能撤回', async () => {
    vi.spyOn(api, 'listShipments').mockResolvedValue({
      items: [{ ...detailShipment, owner_user_id: 'u-owner' }],
      total: 1,
      summary: emptySummary,
    })

    render(
      <ShipmentsPage
        currentUser={{ ...currentUser, id: 'u-sales', permissions: ['sales:shipment:edit'] }}
        detailId="s-1"
        onNavigate={onNavigate}
      />,
    )

    expect(await screen.findByRole('button', { name: /撤\s*回/ })).toBeDisabled()
  })

  it('草稿状态不展示撤回入口', async () => {
    vi.spyOn(api, 'listShipments').mockResolvedValue({
      items: [
        {
          ...detailShipment,
          owner_user_id: 'u-sales',
          approval_status: 'draft',
          reviewer_id: null,
          reviewer_name: null,
        },
      ],
      total: 1,
      summary: emptySummary,
    })

    render(
      <ShipmentsPage
        currentUser={{ ...currentUser, id: 'u-sales', permissions: ['sales:shipment:edit'] }}
        detailId="s-1"
        onNavigate={onNavigate}
      />,
    )

    expect(await screen.findByText('收付款和利润概览')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /撤\s*回/ })).not.toBeInTheDocument()
  })

  it('指定审批人驳回并记录原因后刷新', async () => {
    vi.spyOn(api, 'listShipments').mockResolvedValue({
      items: [{ ...detailShipment, reviewer_id: 'u-sales', reviewer_name: '销售A' }],
      total: 1,
      summary: emptySummary,
    })
    const rejectSpy = vi.spyOn(api, 'rejectShipment').mockResolvedValue({
      ...detailShipment,
      reviewer_id: 'u-sales',
      reviewer_name: '销售A',
      approval_status: 'rejected',
      rejected_at: '2026-08-19',
      rejection_reason: '单证信息有误',
    })

    render(
      <ShipmentsPage
        currentUser={{ ...currentUser, id: 'u-sales', permissions: ['sales:shipment:approve'] }}
        detailId="s-1"
        onNavigate={onNavigate}
      />,
    )

    const rejectButton = await screen.findByRole('button', { name: /驳\s*回/ })
    expect(rejectButton).toBeEnabled()

    await userEvent.click(rejectButton)
    await userEvent.type(await screen.findByLabelText(/驳回原因/), '单证信息有误')
    await userEvent.click(screen.getByRole('button', { name: '确认驳回' }))

    await waitFor(() => expect(rejectSpy).toHaveBeenCalledTimes(1))
    expect(rejectSpy.mock.calls[0][0]).toBe('s-1')
    expect(rejectSpy.mock.calls[0][1]).toMatchObject({
      rejection_reason: '单证信息有误',
      rejected_at: expect.any(String),
    })
    expect(await screen.findByText('已驳回出货明细 S-001')).toBeTruthy()
    expect(await screen.findByText('单证信息有误')).toBeTruthy()
  })

  it('驳回弹窗要求填写原因后才可确认', async () => {
    vi.spyOn(api, 'listShipments').mockResolvedValue({
      items: [{ ...detailShipment, reviewer_id: 'u-sales', reviewer_name: '销售A' }],
      total: 1,
      summary: emptySummary,
    })

    render(
      <ShipmentsPage
        currentUser={{ ...currentUser, id: 'u-sales', permissions: ['sales:shipment:approve'] }}
        detailId="s-1"
        onNavigate={onNavigate}
      />,
    )

    await userEvent.click(await screen.findByRole('button', { name: /驳\s*回/ }))
    expect(await screen.findByRole('button', { name: '确认驳回' })).toBeDisabled()
  })

  it('非指定审批人不可驳回', async () => {
    vi.spyOn(api, 'listShipments').mockResolvedValue({
      items: [{ ...detailShipment, reviewer_id: 'u-owner' }],
      total: 1,
      summary: emptySummary,
    })

    render(
      <ShipmentsPage
        currentUser={{ ...currentUser, id: 'u-sales', permissions: ['sales:shipment:approve'] }}
        detailId="s-1"
        onNavigate={onNavigate}
      />,
    )

    expect(await screen.findByRole('button', { name: /驳\s*回/ })).toBeDisabled()
  })

  it('已驳回明细展示原因与重新同步入口，点击后回到草稿', async () => {
    const rejectedShipment = {
      ...detailShipment,
      owner_user_id: 'u-sales',
      approval_status: 'rejected',
      rejected_at: '2026-08-19',
      rejection_reason: '请同步最新合同价',
      submitted_at: null,
      reviewer_id: null,
      reviewer_name: null,
    }
    vi.spyOn(api, 'listShipments').mockResolvedValue({
      items: [rejectedShipment],
      total: 1,
      summary: emptySummary,
    })
    const resyncSpy = vi.spyOn(api, 'resyncShipmentFromContracts').mockResolvedValue({
      ...rejectedShipment,
      approval_status: 'draft',
      finance_overview: { ...rejectedShipment.finance_overview, receivable_amount: '600.00' },
    })

    render(
      <ShipmentsPage
        currentUser={{ ...currentUser, id: 'u-sales', permissions: ['sales:shipment:edit'] }}
        detailId="s-1"
        onNavigate={onNavigate}
      />,
    )

    expect(await screen.findByText('请同步最新合同价')).toBeTruthy()
    const resyncButton = await screen.findByRole('button', { name: '从合同重新同步' })
    await userEvent.click(resyncButton)

    await waitFor(() => expect(resyncSpy).toHaveBeenCalledWith('s-1'))
    expect(await screen.findByText('已从合同重新同步出货明细 S-001')).toBeTruthy()
  })
})
