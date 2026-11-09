import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as api from '@/api'
import type { SampleDelivery } from '@/api'
import { SampleDeliveriesPage } from '@/app/pages/sample/SampleDeliveriesPage'
import { sampleDeliveryPath } from '@/app/routes'

vi.mock('@/shared/print', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/print')>()
  return { ...actual, downloadCsv: vi.fn() }
})

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

  it('保存草稿编辑提交更新后的客户名称', async () => {
    vi.spyOn(api, 'listSampleDeliveries').mockResolvedValue({ items: [delivery], total: 1 })
    const updateSpy = vi
      .spyOn(api, 'updateSampleDelivery')
      .mockResolvedValue({ ...delivery, customer_name: '客户B' })

    render(
      <SampleDeliveriesPage currentUser={currentUser} detailId="sd-1" onNavigate={onNavigate} />,
    )

    await userEvent.click(await screen.findByRole('button', { name: '编辑草稿' }))
    const dialog = await screen.findByRole('dialog')
    const customerInput = within(dialog).getByLabelText('客户名称')
    await userEvent.clear(customerInput)
    await userEvent.type(customerInput, '客户B')
    await userEvent.click(within(dialog).getByRole('button', { name: '保存草稿编辑' }))

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        'sd-1',
        expect.objectContaining({ customer_name: '客户B' }),
      )
    })
    expect(await screen.findByText('已保存寄样单 SD-001')).toBeTruthy()
  })

  it('指定审批人后提交寄样单审核', async () => {
    vi.spyOn(api, 'listSampleDeliveries').mockResolvedValue({ items: [delivery], total: 1 })
    vi.spyOn(api, 'listAssignableUsers').mockResolvedValue({
      users: [{ id: 'u-2', display_name: '李四', department_name: '管理部' }],
    } as never)
    const submitSpy = vi
      .spyOn(api, 'submitSampleDelivery')
      .mockResolvedValue({ ...delivery, status: 'submitted', reviewer_id: 'u-2' })

    render(
      <SampleDeliveriesPage currentUser={currentUser} detailId="sd-1" onNavigate={onNavigate} />,
    )

    await userEvent.click(await screen.findByLabelText('审批人'))
    await userEvent.click(await screen.findByText('李四 / 管理部'))
    await userEvent.click(screen.getByRole('button', { name: '提交审核' }))

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledWith('sd-1', { reviewer_id: 'u-2' })
    })
    expect(await screen.findByText('已提交寄样单 SD-001')).toBeTruthy()
  })

  it('指定审批人审核通过寄样单', async () => {
    vi.spyOn(api, 'listSampleDeliveries').mockResolvedValue({
      items: [
        {
          ...delivery,
          status: 'submitted',
          reviewer_id: 'u-reviewer',
          reviewer_name: '李四',
        },
      ],
      total: 1,
    })
    const approveSpy = vi
      .spyOn(api, 'approveSampleDelivery')
      .mockResolvedValue({ ...delivery, status: 'approved', reviewer_id: 'u-reviewer' })

    render(
      <SampleDeliveriesPage
        currentUser={{ ...currentUser, id: 'u-reviewer', permissions: ['sample:delivery:approve'] }}
        detailId="sd-1"
        onNavigate={onNavigate}
      />,
    )

    const approveButton = await screen.findByRole('button', { name: '审核通过' })
    expect(approveButton).toBeEnabled()
    await userEvent.click(approveButton)

    await waitFor(() => {
      expect(approveSpy).toHaveBeenCalledWith(
        'sd-1',
        expect.objectContaining({ approved_at: '2026-08-01' }),
      )
    })
    expect(await screen.findByText('已审核寄样单 SD-001')).toBeTruthy()
  })

  it('按客户筛选导出寄样记录', async () => {
    vi.spyOn(api, 'listSampleDeliveries').mockResolvedValue({ items: [delivery], total: 1 })
    const exportSpy = vi.spyOn(api, 'exportSampleDeliveries').mockResolvedValue({
      filename: 'sample-deliveries.csv',
      content: 'code\nSD-001',
      total: 2,
    } as never)

    render(
      <SampleDeliveriesPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )
    await waitFor(() => expect(api.listSampleDeliveries).toHaveBeenCalled())

    await userEvent.type(screen.getByLabelText('客户标识'), 'c-9')
    await userEvent.click(screen.getByRole('button', { name: '导出寄样' }))

    await waitFor(() => {
      expect(exportSpy).toHaveBeenCalledWith(expect.objectContaining({ customer_id: 'c-9' }))
    })
    expect(await screen.findByText('已导出 2 条寄样记录')).toBeTruthy()
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

  it('详情页按样品与客户、产品加载样品和报价历史', async () => {
    vi.spyOn(api, 'listSampleDeliveries').mockResolvedValue({
      items: [
        {
          ...delivery,
          lines: [
            {
              id: 'line-1',
              sample_record_id: 'sr-1',
              sample_code: 'S-001',
              sample_type: 'confirm_sample',
              product_id: 'p-1',
              product_code: 'P-001',
              product_name: '新品杯',
              quantity: '2',
              unit: 'pcs',
              remark: null,
            },
          ],
        } as unknown as SampleDelivery,
      ],
      total: 1,
    })
    const sampleHistorySpy = vi
      .spyOn(api, 'getSampleDeliverySampleHistory')
      .mockResolvedValue({ items: [delivery], total: 1 })
    const quoteHistorySpy = vi
      .spyOn(api, 'getSampleDeliveryQuoteHistory')
      .mockResolvedValue({ items: [], total: 0 })

    render(
      <SampleDeliveriesPage currentUser={currentUser} detailId="sd-1" onNavigate={onNavigate} />,
    )

    await waitFor(() => expect(sampleHistorySpy).toHaveBeenCalledWith('sr-1'))
    expect(quoteHistorySpy).toHaveBeenCalledWith({ customer_id: 'c-1', product_id: 'p-1' })
  })

  it('详情页返回列表跳转寄样单列表路径', async () => {
    vi.spyOn(api, 'listSampleDeliveries').mockResolvedValue({ items: [delivery], total: 1 })

    render(
      <SampleDeliveriesPage currentUser={currentUser} detailId="sd-1" onNavigate={onNavigate} />,
    )

    await userEvent.click(await screen.findByRole('button', { name: '返回列表' }))
    expect(onNavigate).toHaveBeenCalledWith(sampleDeliveryPath)
  })
})
