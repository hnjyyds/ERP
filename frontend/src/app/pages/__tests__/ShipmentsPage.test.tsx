import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

  it('uses business-readable selectors for shipment contracts', () => {
    render(<ShipmentsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)

    fireEvent.click(screen.getByRole('button', { name: '生成出货明细' }))

    expect(screen.getByLabelText('出口合同 A')).toHaveAttribute('role', 'combobox')
    expect(screen.getByLabelText('出口合同 B（可选）')).toHaveAttribute('role', 'combobox')
    expect(screen.queryByLabelText('合同标识 A')).not.toBeInTheDocument()
  })

  it('按服务端分页请求且在翻页时保持后端汇总指标不变', async () => {
    window.history.replaceState({}, '', '/')
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
    vi.spyOn(api, 'listShipmentReminders').mockResolvedValue({ items: [], total: 0 })

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
})
