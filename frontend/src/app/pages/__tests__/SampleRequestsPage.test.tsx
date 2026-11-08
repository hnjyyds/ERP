import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as api from '@/api'
import type { SampleRequest } from '@/api'
import { SampleRequestsPage } from '@/app/pages/sample/SampleRequestsPage'

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
      expect(listSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: 'SR-9', offset: 0 }),
      )
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
    const listSpy = vi
      .spyOn(api, 'listSampleRequests')
      .mockResolvedValue(listResult([request]))
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

    render(
      <SampleRequestsPage currentUser={currentUser} detailId="sr-1" onNavigate={onNavigate} />,
    )

    await userEvent.click(await screen.findByRole('button', { name: '更新打样进度' }))

    await waitFor(() => expect(progressSpy).toHaveBeenCalledTimes(1))
    expect(progressSpy.mock.calls[0][0]).toBe('sr-1')
    expect(await screen.findByText(/已更新打样进度/)).toBeTruthy()
  })
})
