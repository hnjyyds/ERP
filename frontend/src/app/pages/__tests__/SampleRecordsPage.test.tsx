import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as api from '@/api'
import type { SampleRecord } from '@/api'
import { SampleRecordsPage } from '@/app/pages/sample/SampleRecordsPage'

const record = {
  id: 'rec-1',
  code: 'SP-001',
  sample_type: 'customer',
  status: 'received',
  product_id: null,
  product_code: 'P-1',
  product_name: '陶瓷杯',
  customer_id: null,
  customer_name: '客户A',
  supplier_id: null,
  supplier_name: null,
  customer_sku: null,
  supplier_sku: null,
  purchase_contract_id: null,
  purchase_contract_no: null,
  source_type: null,
  source_id: null,
  source_code: null,
  source_note: null,
  received_at: '2026-08-01',
  submitted_at: null,
  quantity: '10',
  unit: 'pcs',
  description: null,
  owner_user_id: 'u-1',
  images: [],
  stock_summary: {
    received_quantity: '10',
    delivered_quantity: '0',
    available_quantity: '10',
    unit: 'pcs',
  },
  stock_events: [],
  followup_events: [],
} as unknown as SampleRecord

describe('SampleRecordsPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = render(
      <SampleRecordsPage detailId={null} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders sample record list panel', () => {
    render(<SampleRecordsPage detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByText('样品列表')).toBeTruthy()
  })

  it('首屏加载样品台账', async () => {
    const listSpy = vi
      .spyOn(api, 'listSampleRecords')
      .mockResolvedValue({ items: [record], total: 1 })

    render(<SampleRecordsPage detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith({
        q: undefined,
        sample_type: undefined,
        customer_id: undefined,
        purchase_contract_id: undefined,
      })
    })
  })

  it('提交筛选按条件重新查询', async () => {
    const listSpy = vi
      .spyOn(api, 'listSampleRecords')
      .mockResolvedValue({ items: [record], total: 1 })

    render(<SampleRecordsPage detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(listSpy).toHaveBeenCalled())

    await userEvent.type(screen.getByLabelText('样品搜索'), 'SP-9')
    await userEvent.type(screen.getByLabelText('样品客户筛选'), 'c-9')
    await userEvent.type(screen.getByLabelText('采购合同筛选'), 'pc-9')
    await userEvent.click(screen.getByRole('button', { name: '查询' }))

    await waitFor(() => {
      expect(listSpy).toHaveBeenLastCalledWith({
        q: 'SP-9',
        sample_type: undefined,
        customer_id: 'c-9',
        purchase_contract_id: 'pc-9',
      })
    })
  })

  it('新增样品提交表单并提示成功', async () => {
    const created = { ...record, id: 'rec-2', code: 'SP-002' }
    vi.spyOn(api, 'listSampleRecords').mockResolvedValue({ items: [record], total: 1 })
    const createSpy = vi.spyOn(api, 'createSampleRecord').mockResolvedValue(created)

    render(<SampleRecordsPage detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(api.listSampleRecords).toHaveBeenCalled())

    await userEvent.click(screen.getByRole('button', { name: '新增样品' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('产品名称'), '新品杯')
    await userEvent.click(within(dialog).getByRole('button', { name: '新增样品' }))

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1))
    expect(createSpy.mock.calls[0][0]).toMatchObject({ product_name: '新品杯' })
    expect(await screen.findByText('已新增样品 SP-002')).toBeTruthy()
  })

  it('详情页追加样品图片提交图片信息', async () => {
    vi.spyOn(api, 'listSampleRecords').mockResolvedValue({ items: [record], total: 1 })
    const imageSpy = vi.spyOn(api, 'addSampleRecordImage').mockResolvedValue({
      id: 'img-1',
      record_id: 'rec-1',
      file_id: 'file-9',
      filename: 'img.png',
      url: 'https://example.com/img.png',
      caption: null,
    } as never)

    render(<SampleRecordsPage detailId="rec-1" onNavigate={onNavigate} />)

    await userEvent.type(await screen.findByLabelText('图片文件标识'), 'file-9')
    await userEvent.type(screen.getByLabelText('图片文件名'), 'img.png')
    await userEvent.click(screen.getByRole('button', { name: '追加样品图片' }))

    await waitFor(() => expect(imageSpy).toHaveBeenCalledTimes(1))
    expect(imageSpy.mock.calls[0][0]).toBe('rec-1')
    expect(imageSpy.mock.calls[0][1]).toMatchObject({ file_id: 'file-9', filename: 'img.png' })
    expect(await screen.findByText('已追加样品图片 img.png')).toBeTruthy()
  })

  it('详情页登记样品数量提交库存事件', async () => {
    vi.spyOn(api, 'listSampleRecords').mockResolvedValue({ items: [record], total: 1 })
    const stockSpy = vi.spyOn(api, 'addSampleRecordStockEvent').mockResolvedValue({
      id: 'evt-1',
      sample_record_id: 'rec-1',
      event_type: 'received',
      quantity: '3',
      unit: 'pcs',
      occurred_at: '2026-08-03',
      delivery_no: null,
      recipient: null,
      note: null,
    })

    render(<SampleRecordsPage detailId="rec-1" onNavigate={onNavigate} />)

    const quantityInput = await screen.findByLabelText('数量')
    await userEvent.clear(quantityInput)
    await userEvent.type(quantityInput, '3')
    await userEvent.click(screen.getByRole('button', { name: '登记样品数量' }))

    await waitFor(() => expect(stockSpy).toHaveBeenCalledTimes(1))
    expect(stockSpy.mock.calls[0][0]).toBe('rec-1')
    expect(stockSpy.mock.calls[0][1]).toMatchObject({ quantity: '3' })
    expect(await screen.findByText(/已登记样品数量/)).toBeTruthy()
  })
})
