import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as api from '@/api'
import type { ExportQuotation } from '@/api'
import { ExportQuotationsPage } from '@/app/pages/sales/ExportQuotationsPage'

const quotation = {
  id: 'q-1',
  code: 'Q-001',
  approval_status: 'submitted',
  customer_name: '客户A',
  trade_term: 'FOB',
  total_amount: '100.00',
  currency: 'USD',
  generated_contract_no: null,
} as unknown as ExportQuotation

function metricValue(label: string): string | null | undefined {
  const cell = Array.from(document.querySelectorAll('.metric-cell')).find(
    (node) => node.querySelector('.metric-label')?.textContent === label,
  )
  return cell?.querySelector('.metric-value')?.textContent
}

describe('ExportQuotationsPage', () => {
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
      <ExportQuotationsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders quotation list panel', () => {
    render(
      <ExportQuotationsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )
    expect(screen.getByText('报价单列表')).toBeTruthy()
  })

  it('opens the quotation form from the list toolbar', () => {
    render(
      <ExportQuotationsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )

    fireEvent.click(screen.getByRole('button', { name: '新增出口报价' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('新增或编辑出口报价', { exact: true })).toBeInTheDocument()
  })

  it('按服务端分页请求且在翻页时保持后端汇总指标不变', async () => {
    window.history.replaceState({}, '', '/')
    const listSpy = vi.spyOn(api, 'listExportQuotations').mockResolvedValue({
      items: [quotation],
      total: 120,
      summary: { submitted_count: 3, approved_count: 2, total_amount: '300.00', currency: 'USD' },
    })
    vi.spyOn(api, 'listCustomers').mockResolvedValue({ items: [], total: 0 })

    render(
      <ExportQuotationsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
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
