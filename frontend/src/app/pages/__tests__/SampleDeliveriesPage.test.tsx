import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as api from '@/api'
import type { SampleDelivery } from '@/api'
import { SampleDeliveriesPage } from '@/app/pages/sample/SampleDeliveriesPage'

const delivery = {
  id: 'sd-1',
  code: 'SD-001',
  status: 'draft',
  delivery_date: '2026-08-01',
  customer_id: 'c-1',
  customer_name: '客户A',
  supplier_name: null,
  factory_name: null,
  recipient_name: '张三',
  recipient_company: '客户A',
  recipient_address: '宁波',
  express_company: 'DHL',
  tracking_no: null,
  quote_no: null,
  quote_id: null,
  fee_total: '0',
  fees: [],
  reviewer_id: null,
  reviewer_name: null,
  remark: null,
  lines: [],
  owner_user_id: 'u-1',
} as unknown as SampleDelivery

const emptyFeeStatistics = { total_amount: '0', currency: 'USD', by_type: [] }
const emptyDeliveryStatistics = {
  total_quantity: '0',
  customer_statistics: [],
  express_statistics: [],
  fee_statistics: [],
  status_statistics: [],
}

describe('SampleDeliveriesPage', () => {
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
    vi.spyOn(api, 'getSampleDeliveryFeeStatistics').mockResolvedValue(
      emptyFeeStatistics as never,
    )
    vi.spyOn(api, 'getSampleDeliveryStatistics').mockResolvedValue(
      emptyDeliveryStatistics as never,
    )
  })

  it('renders without crashing', () => {
    const { container } = render(
      <SampleDeliveriesPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders sample delivery list panel', () => {
    render(<SampleDeliveriesPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByText('寄样单列表')).toBeTruthy()
  })

  it('首屏同时加载寄样单列表与费用、数量统计', async () => {
    const listSpy = vi
      .spyOn(api, 'listSampleDeliveries')
      .mockResolvedValue({ items: [delivery], total: 1 })

    render(<SampleDeliveriesPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => expect(listSpy).toHaveBeenCalledTimes(1))
    expect(api.getSampleDeliveryFeeStatistics).toHaveBeenCalledTimes(1)
    expect(api.getSampleDeliveryStatistics).toHaveBeenCalledTimes(1)
  })

  it('筛选查询同时作用于列表与报表统计', async () => {
    const listSpy = vi
      .spyOn(api, 'listSampleDeliveries')
      .mockResolvedValue({ items: [delivery], total: 1 })

    render(<SampleDeliveriesPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(listSpy).toHaveBeenCalled())

    await userEvent.type(screen.getByLabelText('寄样搜索'), 'SD-9')
    await userEvent.type(
      screen.getByLabelText('客户标识'),
      'c-9',
    )
    await userEvent.click(screen.getByRole('button', { name: '查询' }))

    await waitFor(() => {
      expect(listSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: 'SD-9', customer_id: 'c-9' }),
      )
    })
    expect(api.getSampleDeliveryStatistics).toHaveBeenLastCalledWith(
      expect.objectContaining({ customer_id: 'c-9' }),
    )
  })

  it('新增寄样单提交表头与明细并提示成功', async () => {
    const created = { ...delivery, id: 'sd-2', code: 'SD-002' }
    vi.spyOn(api, 'listSampleDeliveries').mockResolvedValue({ items: [delivery], total: 1 })
    const createSpy = vi.spyOn(api, 'createSampleDelivery').mockResolvedValue(created)

    render(<SampleDeliveriesPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(api.listSampleDeliveries).toHaveBeenCalled())

    await userEvent.click(screen.getByRole('button', { name: '新增寄样单' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('客户名称'), '客户B')
    await userEvent.type(within(dialog).getByLabelText('产品名称'), '新品杯')
    await userEvent.click(within(dialog).getByRole('button', { name: '新增寄样单' }))

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1))
    expect(createSpy.mock.calls[0][0]).toMatchObject({
      customer_name: '客户B',
      lines: [expect.objectContaining({ product_name: '新品杯' })],
    })
    expect(await screen.findByText('已新增寄样单 SD-002')).toBeTruthy()
  })

  it('非指定审批人不可审核并提示等待指定人', async () => {
    vi.spyOn(api, 'listSampleDeliveries').mockResolvedValue({
      items: [
        {
          ...delivery,
          status: 'submitted',
          reviewer_id: 'u-other',
          reviewer_name: '张三',
        },
      ],
      total: 1,
    })

    render(
      <SampleDeliveriesPage
        currentUser={{ ...currentUser, id: 'u-sales', permissions: ['sample:delivery:approve'] }}
        detailId="sd-1"
        onNavigate={onNavigate}
      />,
    )

    const approveButton = await screen.findByRole('button', { name: '审核通过' })
    expect(approveButton).toBeDisabled()
    expect(screen.getByText('等待 张三 审批')).toBeTruthy()
  })

  it('更新物流提交快递单号并提示', async () => {
    vi.spyOn(api, 'listSampleDeliveries').mockResolvedValue({
      items: [{ ...delivery, status: 'approved' }],
      total: 1,
    })
    const trackingSpy = vi.spyOn(api, 'updateSampleDeliveryTracking').mockResolvedValue({
      ...delivery,
      status: 'shipped',
      tracking_no: 'DHL-999',
    })

    render(
      <SampleDeliveriesPage currentUser={currentUser} detailId="sd-1" onNavigate={onNavigate} />,
    )

    const trackingInput = await screen.findByLabelText('快递单号')
    await userEvent.type(trackingInput, 'DHL-999')
    await userEvent.click(screen.getByRole('button', { name: '更新物流' }))

    await waitFor(() => expect(trackingSpy).toHaveBeenCalledTimes(1))
    expect(trackingSpy.mock.calls[0][0]).toBe('sd-1')
    expect(trackingSpy.mock.calls[0][1]).toMatchObject({ tracking_no: 'DHL-999' })
    expect(await screen.findByText('已更新物流 DHL-999')).toBeTruthy()
  })
})
