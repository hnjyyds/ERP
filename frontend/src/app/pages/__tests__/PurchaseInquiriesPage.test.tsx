import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
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

const detailInquiry = {
  ...inquiry,
  lines: [
    {
      id: 'line-1',
      inquiry_id: 'pi-1',
      product_id: 'p-1',
      product_code: 'P-001',
      product_name: '陶瓷杯',
      specification: '350ml',
      model: null,
      quantity: '1000',
      unit: 'pcs',
    },
  ],
  quotations: [
    {
      id: 'q-1',
      inquiry_id: 'pi-1',
      inquiry_line_id: 'line-1',
      product_id: 'p-1',
      product_code: 'P-001',
      product_name: '陶瓷杯',
      supplier_id: 'sup-1',
      supplier_name: '供应商A',
      quoted_at: '2026-08-02',
      unit_price: '0.78',
      currency: 'USD',
      lead_time_days: 18,
      min_order_quantity: '800',
      sample_available: true,
      has_sample: true,
      remark: null,
    },
  ],
} as unknown as PurchaseInquiry

const emptySummary = { sent_count: 0, quoted_count: 0, quotation_count: 0 }

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

  it('按 URL 恢复筛选条件与页码', async () => {
    window.history.replaceState(
      {},
      '',
      '/purchase/inquiries?q=PI-1&status=sent&product=p-1&supplier=s-1&page=2',
    )
    const listSpy = vi.spyOn(api, 'listPurchaseInquiries').mockResolvedValue({
      items: [inquiry],
      total: 120,
      summary: emptySummary,
    })

    render(<PurchaseInquiriesPage detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'PI-1',
          status: 'sent',
          product_id: 'p-1',
          supplier_id: 's-1',
          limit: 50,
          offset: 50,
        }),
      )
    })
  })

  it('提交筛选会写回 URL 并从第一页重新查询', async () => {
    const listSpy = vi.spyOn(api, 'listPurchaseInquiries').mockResolvedValue({
      items: [inquiry],
      total: 120,
      summary: emptySummary,
    })

    render(<PurchaseInquiriesPage detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(listSpy).toHaveBeenCalled())

    await userEvent.type(screen.getByLabelText('询价搜索'), 'PI-9')
    await userEvent.click(screen.getByRole('button', { name: '查询' }))

    await waitFor(() => {
      expect(window.location.search).toContain('q=PI-9')
    })
    expect(window.location.search).not.toContain('page=')
    await waitFor(() => {
      expect(listSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: 'PI-9', offset: 0 }),
      )
    })
  })

  it('翻到空页时回退上一页并清掉 URL 页码', async () => {
    const listSpy = vi
      .spyOn(api, 'listPurchaseInquiries')
      .mockResolvedValueOnce({ items: [inquiry], total: 120, summary: emptySummary })
      .mockResolvedValueOnce({ items: [], total: 120, summary: emptySummary })
      .mockResolvedValue({ items: [inquiry], total: 120, summary: emptySummary })

    render(<PurchaseInquiriesPage detailId={null} onNavigate={onNavigate} />)
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

  it('详情页按商品与报价供应商加载样品与参考价', async () => {
    vi.spyOn(api, 'listPurchaseInquiries').mockResolvedValue({
      items: [detailInquiry],
      total: 1,
      summary: emptySummary,
    })
    const referencesSpy = vi.spyOn(api, 'listPurchaseInquiryReferences').mockResolvedValue({
      items: [
        {
          product_id: 'p-1',
          product_code: 'P-001',
          product_name: '陶瓷杯',
          supplier_name: '供应商A',
          reference_price: '0.72',
          currency: 'USD',
          quote_date: '2026-07-01',
          source_inquiry_no: 'PI-000',
        },
      ],
      total: 1,
    })
    const samplesSpy = vi
      .spyOn(api, 'listPurchaseInquirySupplierSamples')
      .mockResolvedValue({ items: [], total: 0 })

    render(<PurchaseInquiriesPage detailId="pi-1" onNavigate={onNavigate} />)

    await waitFor(() => {
      expect(referencesSpy).toHaveBeenCalledWith({ product_id: 'p-1' })
    })
    expect(samplesSpy).toHaveBeenCalledWith({ product_id: 'p-1', supplier_id: 'sup-1' })
    expect(await screen.findByText('PI-000')).toBeTruthy()
  })

  it('新增询价提交明细后刷新列表并给出成功提示', async () => {
    const created = { ...inquiry, id: 'pi-2', code: 'PI-002' }
    const listSpy = vi.spyOn(api, 'listPurchaseInquiries').mockResolvedValue({
      items: [inquiry],
      total: 1,
      summary: emptySummary,
    })
    const createSpy = vi.spyOn(api, 'createPurchaseInquiry').mockResolvedValue(created)

    render(<PurchaseInquiriesPage detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(listSpy).toHaveBeenCalled())

    await userEvent.click(screen.getByRole('button', { name: '新增采购询价' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('商品名称'), '测试商品')
    await userEvent.click(within(dialog).getByRole('button', { name: '新增采购询价' }))

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1))
    expect(createSpy.mock.calls[0][0].lines[0]).toMatchObject({
      product_name: '测试商品',
      quantity: '1000',
      unit: 'pcs',
    })
    expect(await screen.findByText('已新增采购询价 PI-002')).toBeTruthy()
    await waitFor(() => expect(listSpy).toHaveBeenCalled())
  })

  it('登记报价失败时保留弹窗与已填内容', async () => {
    vi.spyOn(api, 'listPurchaseInquiries').mockResolvedValue({
      items: [detailInquiry],
      total: 1,
      summary: emptySummary,
    })
    vi.spyOn(api, 'listPurchaseInquiryReferences').mockResolvedValue({ items: [], total: 0 })
    vi.spyOn(api, 'listPurchaseInquirySupplierSamples').mockResolvedValue({
      items: [],
      total: 0,
    })
    vi.spyOn(api, 'addPurchaseInquiryQuotation').mockRejectedValue(new Error('供应商系统超时'))

    render(<PurchaseInquiriesPage detailId="pi-1" onNavigate={onNavigate} />)

    await userEvent.click(await screen.findByRole('button', { name: '登记供应商报价' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('供应商名称'), '宁波厂')
    await userEvent.click(within(dialog).getByRole('button', { name: '登记供应商报价' }))

    expect(await screen.findByText('供应商系统超时')).toBeTruthy()
    expect(within(dialog).getByLabelText('供应商名称')).toHaveValue('宁波厂')
  })
})
