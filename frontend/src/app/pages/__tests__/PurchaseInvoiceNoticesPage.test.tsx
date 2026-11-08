import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as api from '@/api'
import type { PurchaseInvoiceNotice } from '@/api'
import { PurchaseInvoiceNoticesPage } from '@/app/pages/purchase/PurchaseInvoiceNoticesPage'

const notice: PurchaseInvoiceNotice = {
  id: 'pin-1',
  code: 'PIN-001',
  notice_date: '2026-08-01',
  supplier_id: 'supplier-1',
  supplier_name: '贝斯特针织',
  customs_declaration_id: null,
  customs_declaration_no: 'CD-001',
  declaration_date: '2026-07-30',
  currency: 'USD',
  remarks: null,
  status: 'sent',
  sent_at: '2026-08-01',
  sender_name: '管理员',
  tax_invoice_no: null,
  tax_invoice_received_at: null,
  total_quantity: '100',
  total_amount: '300.00',
  owner_user_id: 'u-1',
  lines: [],
  reminders: [],
}

function metricValue(label: string): string | null | undefined {
  const cell = Array.from(document.querySelectorAll('.metric-cell')).find(
    (node) => node.querySelector('.metric-label')?.textContent === label,
  )
  return cell?.querySelector('.metric-value')?.textContent
}

describe('PurchaseInvoiceNoticesPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, '', '/')
  })

  it('renders without crashing', () => {
    const { container } = render(<PurchaseInvoiceNoticesPage detailId={null} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders invoice notice list panel', () => {
    render(<PurchaseInvoiceNoticesPage detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByText('开票通知列表')).toBeTruthy()
  })

  it('按服务端分页请求且在翻页时保持后端汇总指标不变', async () => {
    const listSpy = vi.spyOn(api, 'listPurchaseInvoiceNotices').mockResolvedValue({
      items: [notice],
      total: 120,
      summary: { sent_count: 4, received_count: 1, total_amount: '300.00', currency: 'USD' },
    })
    vi.spyOn(api, 'listPurchaseInvoiceNoticeReminders').mockResolvedValue({ items: [], total: 0 })

    render(<PurchaseInvoiceNoticesPage detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ limit: 50, offset: 0 }))
    })
    expect(metricValue('已发送')).toBe('4')
    expect(metricValue('已收票')).toBe('1')

    await userEvent.click(screen.getByTitle('2'))

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ limit: 50, offset: 50 }))
    })
    expect(metricValue('已发送')).toBe('4')
    expect(metricValue('已收票')).toBe('1')
  })
})
