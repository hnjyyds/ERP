import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
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

function currentQuery() {
  return new URLSearchParams(window.location.search)
}

const noticeSummary = {
  sent_count: 4,
  received_count: 1,
  total_amount: '300.00',
  currency: 'USD',
}

function mockList(items: PurchaseInvoiceNotice[] = [notice]) {
  const listSpy = vi.spyOn(api, 'listPurchaseInvoiceNotices').mockResolvedValue({
    items,
    total: items.length,
    summary: noticeSummary,
  })
  vi.spyOn(api, 'listPurchaseInvoiceNoticeReminders').mockResolvedValue({ items: [], total: 0 })
  return listSpy
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

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('从 URL 恢复筛选与页码', async () => {
    const listSpy = mockList()
    window.history.replaceState(
      {},
      '',
      '/purchase/invoice-notices?q=CD&status=sent&supplier=sup-1&customs=cd-9&page=2',
    )
    render(<PurchaseInvoiceNoticesPage detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'CD',
          status: 'sent',
          supplier_id: 'sup-1',
          customs_declaration_id: 'cd-9',
          limit: 50,
          offset: 50,
        }),
      )
    })
    expect(screen.getByPlaceholderText('通知号 / 供应商 / 品名')).toHaveValue('CD')
    expect(screen.getByLabelText('供应商标识')).toHaveValue('sup-1')
    expect(screen.getByLabelText('报关单证 ID')).toHaveValue('cd-9')
  })

  it('提交筛选写入 URL 并回到第一页', async () => {
    window.history.replaceState({}, '', '/purchase/invoice-notices?page=3')
    const listSpy = mockList()
    const user = userEvent.setup()
    render(<PurchaseInvoiceNoticesPage detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ offset: 100 }))
    })

    await user.type(screen.getByPlaceholderText('通知号 / 供应商 / 品名'), 'PIN')
    await user.type(screen.getByLabelText('供应商标识'), 'sup-1')
    await user.type(screen.getByLabelText('报关单证 ID'), 'cd-9')
    await user.click(screen.getByRole('button', { name: '查询' }))

    await waitFor(() => {
      expect(listSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          q: 'PIN',
          supplier_id: 'sup-1',
          customs_declaration_id: 'cd-9',
          limit: 50,
          offset: 0,
        }),
      )
    })
    expect(currentQuery().get('q')).toBe('PIN')
    expect(currentQuery().get('supplier')).toBe('sup-1')
    expect(currentQuery().get('customs')).toBe('cd-9')
    expect(currentQuery().get('page')).toBeNull()
  })

  it('从报关单证生成开票通知并提交行项目', async () => {
    const listSpy = mockList()
    const generateSpy = vi
      .spyOn(api, 'generatePurchaseInvoiceNoticesFromDeclaration')
      .mockResolvedValue({
        items: [{ ...notice, id: 'pin-9', code: 'PIN-009' }],
        total: 1,
        summary: noticeSummary,
      })
    const user = userEvent.setup()
    render(<PurchaseInvoiceNoticesPage detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(listSpy).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: '生成开票通知' }))
    const dialog = await screen.findByRole('dialog')

    await user.type(within(dialog).getByLabelText('报关单号'), 'CD-2026-9')
    await user.type(within(dialog).getAllByLabelText('供应商')[0], '供应商A')
    await user.type(within(dialog).getAllByLabelText('报关品名')[0], '报关品名A')
    await user.type(within(dialog).getAllByLabelText('开票品名')[0], '开票品名A')
    await user.click(within(dialog).getByRole('button', { name: '生成开票通知' }))

    await waitFor(() => {
      expect(generateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          customs_declaration_no: 'CD-2026-9',
          lines: [
            expect.objectContaining({
              supplier_name: '供应商A',
              product_name: 'Eco Shopping Bag',
              customs_name: '报关品名A',
              invoice_name: '开票品名A',
            }),
          ],
        }),
      )
    })
    expect(await screen.findByText('已生成 1 条供应商开票通知')).toBeInTheDocument()
  })

  it('详情页发送开票通知', async () => {
    const draftNotice: PurchaseInvoiceNotice = {
      ...notice,
      status: 'draft',
      sent_at: null,
      sender_name: null,
    }
    mockList([draftNotice])
    const sendSpy = vi.spyOn(api, 'sendPurchaseInvoiceNotice').mockResolvedValue({
      ...draftNotice,
      status: 'sent',
      sender_name: '张三',
      sent_at: '2026-08-02',
    })
    const user = userEvent.setup()
    render(<PurchaseInvoiceNoticesPage detailId="pin-1" onNavigate={onNavigate} />)

    expect(await screen.findByText('开票通知明细')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '发送开票通知' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('发送人'), '张三')
    await user.click(within(dialog).getByRole('button', { name: '发送开票通知' }))

    await waitFor(() => {
      expect(sendSpy).toHaveBeenCalledWith(
        'pin-1',
        expect.objectContaining({ sender_name: '张三' }),
      )
    })
    expect(await screen.findByText(/已发送开票通知 PIN-001/)).toBeInTheDocument()
  })

  it('详情页登记供应商税票', async () => {
    const sentNotice: PurchaseInvoiceNotice = { ...notice, status: 'sent' }
    mockList([sentNotice])
    const receiveSpy = vi
      .spyOn(api, 'receivePurchaseInvoiceNoticeTaxInvoice')
      .mockResolvedValue({
        ...sentNotice,
        status: 'received',
        tax_invoice_no: 'VAT-2026-001',
        tax_invoice_received_at: '2026-08-03',
      })
    const user = userEvent.setup()
    render(<PurchaseInvoiceNoticesPage detailId="pin-1" onNavigate={onNavigate} />)

    expect(await screen.findByText('开票通知明细')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '登记税票' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: '登记税票' }))

    await waitFor(() => {
      expect(receiveSpy).toHaveBeenCalledWith(
        'pin-1',
        expect.objectContaining({ tax_invoice_no: 'VAT-2026-001' }),
      )
    })
    expect(await screen.findByText('已登记税票 VAT-2026-001')).toBeInTheDocument()
  })
})
