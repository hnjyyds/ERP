import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as api from '@/api'
import type { PurchaseInquiry } from '@/api'
import { PurchaseInquiriesPage } from '@/app/pages/purchase/PurchaseInquiriesPage'

const inquiry: PurchaseInquiry = {
  id: 'pi-1',
  code: 'PI-001',
  inquiry_date: '2026-08-01',
  buyer_user_id: null,
  buyer_user_name: null,
  status: 'sent',
  template_name: null,
  template_sent_at: null,
  remarks: null,
  owner_user_id: 'u-1',
  lines: [],
  quotations: [],
}

function metricValue(label: string): string | null | undefined {
  const cell = Array.from(document.querySelectorAll('.metric-cell')).find(
    (node) => node.querySelector('.metric-label')?.textContent === label,
  )
  return cell?.querySelector('.metric-value')?.textContent
}

describe('PurchaseInquiriesPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, '', '/')
  })

  it('renders without crashing', () => {
    const { container } = render(<PurchaseInquiriesPage detailId={null} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders purchase inquiry list panel', () => {
    render(<PurchaseInquiriesPage detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByText('采购询价列表')).toBeTruthy()
  })

  it('按服务端分页请求且在翻页时保持后端汇总指标不变', async () => {
    const listSpy = vi.spyOn(api, 'listPurchaseInquiries').mockResolvedValue({
      items: [inquiry],
      total: 120,
      summary: { sent_count: 3, quoted_count: 2, quotation_count: 7 },
    })

    render(<PurchaseInquiriesPage detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ limit: 50, offset: 0 }))
    })
    expect(metricValue('已发模板')).toBe('3')
    expect(metricValue('已报价')).toBe('2')
    expect(metricValue('供应商报价')).toBe('7')

    await userEvent.click(screen.getByTitle('2'))

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ limit: 50, offset: 50 }))
    })
    expect(metricValue('已发模板')).toBe('3')
    expect(metricValue('已报价')).toBe('2')
    expect(metricValue('供应商报价')).toBe('7')
  })
})
