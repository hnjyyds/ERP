import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as api from '@/api'
import type { SampleRequest } from '@/api'
import { sampleRequestPath } from '@/app/routes'
import { openSampleRequestPrint } from '@/shared/print'
import { SampleRequestsPage } from '@/app/pages/sample/SampleRequestsPage'

vi.mock('@/shared/print', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/print')>()
  return { ...actual, openSampleRequestPrint: vi.fn() }
})

const request: SampleRequest = {
  id: 'sr-1',
  code: 'SR-001',
  request_date: '2026-08-01',
  customer_id: 'c-1',
  customer_name: '客户A',
  product_id: 'p-1',
  product_code: 'P-1',
  product_name: '陶瓷杯',
  supplier_id: null,
  supplier_name: null,
  sales_user_id: null,
  sales_user_name: null,
  destination: 'customer',
  requirements: '按图打样',
  due_date: '2026-08-10',
  status: 'in_progress',
  owner_user_id: 'u-1',
  lines: [],
  progress_events: [],
  fees: [],
}

const summary = { in_progress_count: 1 }

function listResult(items: SampleRequest[], total = items.length) {
  return { items, total, summary }
}

describe('SampleRequestsPage', () => {
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
      <SampleRequestsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders sample request list panel', () => {
    render(<SampleRequestsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByText('打样单列表')).toBeTruthy()
  })

  it('首屏按服务端分页请求打样单', async () => {
    const listSpy = vi.spyOn(api, 'listSampleRequests').mockResolvedValue(listResult([request]))

    render(<SampleRequestsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ limit: 50, offset: 0 }))
    })
  })

  it('提交筛选按条件从第一页重新查询', async () => {
    const listSpy = vi.spyOn(api, 'listSampleRequests').mockResolvedValue(listResult([request]))

    render(<SampleRequestsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(listSpy).toHaveBeenCalled())

    await userEvent.type(screen.getByLabelText('打样搜索'), 'SR-9')
    await userEvent.click(screen.getByRole('button', { name: '查询' }))

    await waitFor(() => {
      expect(listSpy).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'SR-9', offset: 0 }))
    })
  })

  it('翻到空页时回退上一页', async () => {
    const listSpy = vi
      .spyOn(api, 'listSampleRequests')
      .mockResolvedValueOnce(listResult([request], 120))
      .mockResolvedValueOnce(listResult([], 120))
      .mockResolvedValue(listResult([request], 120))

    render(<SampleRequestsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(listSpy).toHaveBeenCalledTimes(1))

    await userEvent.click(screen.getByTitle('2'))

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ offset: 50 }))
    })
    await waitFor(() => {
      expect(listSpy).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 0 }))
    })
  })

  it('新增打样单提交表头与明细并提示成功', async () => {
    const created = { ...request, id: 'sr-2', code: 'SR-002' }
    const listSpy = vi.spyOn(api, 'listSampleRequests').mockResolvedValue(listResult([request]))
    const createSpy = vi.spyOn(api, 'createSampleRequest').mockResolvedValue(created)

    render(<SampleRequestsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(listSpy).toHaveBeenCalled())

    await userEvent.click(screen.getByRole('button', { name: '新增打样单' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('打样客户名称'), '客户B')
    await userEvent.type(within(dialog).getByLabelText('打样产品名称'), '新品杯')
    await userEvent.type(within(dialog).getByLabelText('明细产品名称'), '新品杯')
    await userEvent.click(within(dialog).getByRole('button', { name: '新增打样单' }))

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1))
    expect(createSpy.mock.calls[0][0]).toMatchObject({
      customer_name: '客户B',
      product_name: '新品杯',
      lines: [expect.objectContaining({ product_name: '新品杯' })],
    })
    expect(await screen.findByText('已新增打样单 SR-002')).toBeTruthy()
    await waitFor(() => {
      expect(listSpy).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 0 }))
    })
  })

  it('登记打样费用提交金额与币种并提示成功', async () => {
    vi.spyOn(api, 'listSampleRequests').mockResolvedValue(listResult([request]))
    const feeSpy = vi.spyOn(api, 'addSampleFee').mockResolvedValue({
      id: 'fee-1',
      fee_type: 'sample_making',
      amount: '120',
      currency: 'USD',
      payee_type: 'supplier',
      payee_name: '',
      payment_status: 'pending',
      payment_request_no: null,
      remark: null,
    } as never)

    render(<SampleRequestsPage currentUser={currentUser} detailId="sr-1" onNavigate={onNavigate} />)

    const amountInput = await screen.findByLabelText('打样费用金额')
    await userEvent.clear(amountInput)
    await userEvent.type(amountInput, '120')
    await userEvent.click(screen.getByRole('button', { name: '登记打样费用' }))

    await waitFor(() => {
      expect(feeSpy).toHaveBeenCalledWith(
        'sr-1',
        expect.objectContaining({ amount: '120', currency: 'USD' }),
      )
    })
    expect(await screen.findByText(/已登记打样费用/)).toBeTruthy()
  })

  it('指定付费审批人后发起费用付款申请', async () => {
    const requestWithFee = {
      ...request,
      fees: [
        {
          id: 'fee-1',
          fee_type: 'sample_making',
          amount: '80',
          currency: 'USD',
          payee_type: 'supplier',
          payee_name: '工厂A',
          payment_status: 'pending',
          payment_request_no: null,
          remark: null,
        },
      ],
    } as unknown as SampleRequest
    vi.spyOn(api, 'listSampleRequests').mockResolvedValue(listResult([requestWithFee]))
    vi.spyOn(api, 'listAssignableUsers').mockResolvedValue({
      users: [{ id: 'u-2', display_name: '李四', department_name: '财务部' }],
    } as never)
    const paymentSpy = vi.spyOn(api, 'requestSampleFeePayment').mockResolvedValue({
      ...requestWithFee.fees[0],
      payment_request_no: 'PR-001',
    } as never)

    render(<SampleRequestsPage currentUser={currentUser} detailId="sr-1" onNavigate={onNavigate} />)

    await userEvent.click(await screen.findByLabelText('付费审批人'))
    await userEvent.click(await screen.findByText('李四 / 财务部'))
    await userEvent.click(screen.getByRole('button', { name: '发起付款' }))

    await waitFor(() => {
      expect(paymentSpy).toHaveBeenCalledWith('sr-1', 'fee-1', { reviewer_id: 'u-2' })
    })
    expect(await screen.findByText('已发起打样费用付款申请')).toBeTruthy()
  })

  it('载入打样单并转为样品登记', async () => {
    const completed = { ...request, status: 'completed' } as SampleRequest
    vi.spyOn(api, 'listSampleRequests').mockResolvedValue(listResult([completed]))
    const convertSpy = vi.spyOn(api, 'createSampleRecordFromRequest').mockResolvedValue({
      id: 'rec-9',
      code: 'SP-009',
    } as never)

    render(<SampleRequestsPage currentUser={currentUser} detailId="sr-1" onNavigate={onNavigate} />)

    await userEvent.click(await screen.findByRole('button', { name: '载入为样品' }))
    const quantityInput = screen.getByLabelText('收样数量')
    await userEvent.clear(quantityInput)
    await userEvent.type(quantityInput, '5')
    await userEvent.click(screen.getByRole('button', { name: '转为样品登记' }))

    await waitFor(() => {
      expect(convertSpy).toHaveBeenCalledWith(
        'sr-1',
        expect.objectContaining({ sample_type: 'confirm_sample', quantity: '5', unit: 'pcs' }),
      )
    })
    expect(await screen.findByText('已转为样品 SP-009')).toBeTruthy()
  })

  it('详情页更新打样进度后提示并保留当前单', async () => {
    vi.spyOn(api, 'listSampleRequests').mockResolvedValue(listResult([request]))
    const progressSpy = vi.spyOn(api, 'addSampleProgress').mockResolvedValue({
      id: 'pg-2',
      sample_request_id: 'sr-1',
      stage: 'sampling',
      status: 'completed',
      occurred_at: '2026-08-03',
      note: null,
      handler_name: null,
    })

    render(<SampleRequestsPage currentUser={currentUser} detailId="sr-1" onNavigate={onNavigate} />)

    await userEvent.click(await screen.findByRole('button', { name: '更新打样进度' }))

    await waitFor(() => expect(progressSpy).toHaveBeenCalledTimes(1))
    expect(progressSpy.mock.calls[0][0]).toBe('sr-1')
    expect(await screen.findByText(/已更新打样进度/)).toBeTruthy()
  })

  it('详情页打印内部打样单调用打印入口', async () => {
    vi.spyOn(api, 'listSampleRequests').mockResolvedValue(listResult([request]))
    const printSpy = vi.mocked(openSampleRequestPrint).mockResolvedValue()

    render(<SampleRequestsPage currentUser={currentUser} detailId="sr-1" onNavigate={onNavigate} />)

    await userEvent.click(await screen.findByRole('button', { name: '打印内部打样单' }))

    expect(printSpy).toHaveBeenCalledWith('sr-1')
  })

  it('详情页返回列表时导航到打样单列表', async () => {
    vi.spyOn(api, 'listSampleRequests').mockResolvedValue(listResult([request]))

    render(<SampleRequestsPage currentUser={currentUser} detailId="sr-1" onNavigate={onNavigate} />)

    await userEvent.click(await screen.findByRole('button', { name: '返回列表' }))

    expect(onNavigate).toHaveBeenCalledWith(sampleRequestPath)
  })
})
