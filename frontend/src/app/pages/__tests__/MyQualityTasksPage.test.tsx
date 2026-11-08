import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { pendingTask } = vi.hoisted(() => ({
  pendingTask: {
    id: 'qc-task-001',
    code: 'QC-TASK-001',
    purchase_contract_id: 'pc-001',
    purchase_contract_no: 'PC-QC-001',
    supplier_id: 'supplier-001',
    supplier_name: '华东包装制品厂',
    status: 'pending',
    scheduled_at: '2026-08-20T09:30:00',
    inspected_at: null,
    result: null,
    inspector_id: 'user-qc',
    inspector_name: '演示 QC 专员',
    qc_user_id: null,
    qc_user_name: null,
    issue_summary: '宁波仓验货',
    attachment_group_id: null,
    owner_user_id: 'user-manager',
    lines: [],
    issues: [],
  },
}))

vi.mock('@/shared/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/ui')>()
  return {
    ...actual,
    Metric: ({ label, value }: { label: string; value: number | string }) => (
      <span data-testid="metric">{`${label}: ${value}`}</span>
    ),
  }
})

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>()
  return {
    ...actual,
    listQualityInspections: vi.fn().mockResolvedValue({
      items: [pendingTask],
      total: 1,
      summary: {
        pending_count: 1,
        in_progress_count: 0,
        completed_count: 0,
        cancelled_count: 0,
        overdue_count: 0,
        open_issue_count: 0,
        my_action_count: 1,
      },
    }),
    cancelQualityInspection: vi.fn().mockResolvedValue({
      ...pendingTask,
      status: 'cancelled',
      cancel_reason: '供应商取消备货',
    }),
    rescheduleQualityInspection: vi.fn(),
    listPurchaseContracts: vi.fn().mockResolvedValue({
      items: [
        {
          id: 'pc-001',
          code: 'PC-QC-001',
          lines: [
            {
              id: 'pc-line-001',
              product_id: 'product-001',
              product_code: 'BAG-40',
              product_name: 'Eco Shopping Bag',
              quantity: '120',
              unit: 'pcs',
            },
          ],
        },
      ],
      total: 1,
    }),
    updateQualityInspection: vi.fn().mockResolvedValue({
      ...pendingTask,
      status: 'in_progress',
    }),
  }
})

import {
  cancelQualityInspection,
  listPurchaseContracts,
  listQualityInspections,
  rescheduleQualityInspection,
  updateQualityInspection,
  type QualityInspection,
} from '@/api'
import { MyQualityTasksPage } from '@/app/pages/quality/MyQualityTasksPage'

describe('MyQualityTasksPage', () => {
  const currentUser = {
    id: 'user-qc',
    username: 'qc',
    display_name: '演示 QC 专员',
    department_name: '品质部',
    avatar_type: 'preset' as const,
    avatar_value: 'rose-signal',
    roles: ['QC 专员'],
    permissions: ['quality:inspection:view', 'quality:inspection:edit'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, '', '/quality/tasks')
  })

  function metricTexts() {
    return screen.getAllByTestId('metric').map((element) => element.textContent)
  }

  it('loads only tasks assigned to the current user and starts a pending task', async () => {
    const user = userEvent.setup()
    render(<MyQualityTasksPage currentUser={currentUser} />)

    await screen.findByText('QC-TASK-001')
    expect(screen.getAllByText('待查验').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('2026/08/20 09:30')).toBeTruthy()
    expect(listQualityInspections).toHaveBeenCalledWith(
      expect.objectContaining({ inspector_user_id: 'user-qc' }),
    )

    await user.click(screen.getByRole('button', { name: '开始查验' }))

    await waitFor(() => {
      expect(updateQualityInspection).toHaveBeenCalledWith(
        'qc-task-001',
        expect.objectContaining({
          status: 'in_progress',
          result: null,
          lines: [],
        }),
      )
    })
  })

  it('prefills completion details from the linked purchase contract', async () => {
    const user = userEvent.setup()
    vi.mocked(listQualityInspections).mockResolvedValueOnce({
      items: [{ ...pendingTask, status: 'in_progress' }],
      total: 1,
      summary: {
        pending_count: 0,
        in_progress_count: 1,
        completed_count: 0,
        cancelled_count: 0,
        overdue_count: 0,
        open_issue_count: 0,
        my_action_count: 1,
      },
    })
    render(<MyQualityTasksPage currentUser={currentUser} />)

    await user.click(await screen.findByRole('button', { name: '登记结果' }))

    expect(await screen.findByRole('textbox', { name: '商品名称' })).toHaveValue('Eco Shopping Bag')
    expect(screen.getByRole('spinbutton', { name: '查验数量' })).toHaveValue(120)
    expect(screen.getByRole('textbox', { name: '单位' })).toHaveValue('pcs')
  })

  it('submits every purchase contract line when completing a QC task', async () => {
    const user = userEvent.setup()
    vi.mocked(listQualityInspections).mockResolvedValueOnce({
      items: [{ ...pendingTask, status: 'in_progress' }],
      total: 1,
      summary: {
        pending_count: 0,
        in_progress_count: 1,
        completed_count: 0,
        cancelled_count: 0,
        overdue_count: 0,
        open_issue_count: 0,
        my_action_count: 1,
      },
    })
    vi.mocked(listPurchaseContracts).mockResolvedValueOnce({
      items: [
        {
          id: 'pc-001',
          code: 'PC-QC-001',
          lines: [
            {
              id: 'pc-line-001',
              product_id: 'product-001',
              product_code: 'BAG-40',
              product_name: 'Eco Shopping Bag',
              quantity: '120',
              unit: 'pcs',
            },
            {
              id: 'pc-line-002',
              product_id: 'product-002',
              product_code: 'ROPE-10',
              product_name: 'Cotton Rope',
              quantity: '500',
              unit: 'm',
            },
          ],
        },
      ],
      total: 1,
    } as never)
    render(<MyQualityTasksPage currentUser={currentUser} />)

    await user.click(await screen.findByRole('button', { name: '登记结果' }))
    expect(await screen.findByDisplayValue('Cotton Rope')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: '完成 QC 查验' }))

    await waitFor(() => {
      expect(updateQualityInspection).toHaveBeenCalledWith(
        'qc-task-001',
        expect.objectContaining({
          lines: [
            expect.objectContaining({ purchase_contract_line_id: 'pc-line-001' }),
            expect.objectContaining({ purchase_contract_line_id: 'pc-line-002' }),
          ],
        }),
      )
    })
  })

  it('requires and submits a cancellation reason through the dedicated action', async () => {
    const user = userEvent.setup()
    render(<MyQualityTasksPage currentUser={currentUser} />)

    await user.click(await screen.findByRole('button', { name: '取消' }))
    await user.type(screen.getByRole('textbox', { name: '取消原因' }), '供应商取消备货')
    await user.click(screen.getByRole('button', { name: '确认取消' }))

    await waitFor(() => {
      expect(cancelQualityInspection).toHaveBeenCalledWith('qc-task-001', '供应商取消备货')
    })
  })

  it('按 URL 恢复搜索、状态与页码', async () => {
    window.history.replaceState({}, '', '/quality/tasks?q=QC-1&status=in_progress&page=2')
    render(<MyQualityTasksPage currentUser={currentUser} />)

    await waitFor(() => {
      expect(listQualityInspections).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'QC-1',
          status: 'in_progress',
          limit: 50,
          offset: 50,
          inspector_user_id: 'user-qc',
        }),
      )
    })
  })

  it('翻到空页时回退上一页并清掉 URL 页码', async () => {
    const user = userEvent.setup()
    vi.mocked(listQualityInspections)
      .mockResolvedValueOnce({ items: [pendingTask as QualityInspection], total: 120, summary: {
        pending_count: 1,
        in_progress_count: 0,
        completed_count: 0,
        cancelled_count: 0,
        overdue_count: 0,
        open_issue_count: 0,
        my_action_count: 1,
      } })
      .mockResolvedValueOnce({ items: [], total: 120, summary: {
        pending_count: 1,
        in_progress_count: 0,
        completed_count: 0,
        cancelled_count: 0,
        overdue_count: 0,
        open_issue_count: 0,
        my_action_count: 1,
      } })
      .mockResolvedValue({ items: [pendingTask as QualityInspection], total: 120, summary: {
        pending_count: 1,
        in_progress_count: 0,
        completed_count: 0,
        cancelled_count: 0,
        overdue_count: 0,
        open_issue_count: 0,
        my_action_count: 1,
      } })
    render(<MyQualityTasksPage currentUser={currentUser} />)
    await waitFor(() => expect(listQualityInspections).toHaveBeenCalledTimes(1))

    await user.click(screen.getByTitle('2'))

    await waitFor(() => {
      expect(listQualityInspections).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 50 }),
      )
    })
    await waitFor(() => {
      expect(listQualityInspections).toHaveBeenLastCalledWith(
        expect.objectContaining({ offset: 0 }),
      )
    })
    expect(window.location.search).not.toContain('page=')
  })

  it('查验数量无效时阻止提交并提示校验数量', async () => {
    const user = userEvent.setup()
    vi.mocked(listQualityInspections).mockResolvedValueOnce({
      items: [{ ...pendingTask, status: 'in_progress' }],
      total: 1,
      summary: {
        pending_count: 0,
        in_progress_count: 1,
        completed_count: 0,
        cancelled_count: 0,
        overdue_count: 0,
        open_issue_count: 0,
        my_action_count: 1,
      },
    })
    render(<MyQualityTasksPage currentUser={currentUser} />)

    await user.click(await screen.findByRole('button', { name: '登记结果' }))
    await screen.findByDisplayValue('Eco Shopping Bag')
    fireEvent.change(screen.getByRole('spinbutton', { name: /查验数量/ }), {
      target: { value: '0' },
    })
    await user.click(screen.getByRole('button', { name: '完成 QC 查验' }))

    expect(await screen.findByText('请修正 1 项查验信息')).toBeTruthy()
    expect(updateQualityInspection).not.toHaveBeenCalled()
  })

  it('调整排期提交新的排期时间与原因', async () => {
    const user = userEvent.setup()
    vi.mocked(rescheduleQualityInspection).mockResolvedValueOnce({
      ...pendingTask,
      scheduled_at: '2026-09-01T10:00:00',
    } as never)
    render(<MyQualityTasksPage currentUser={currentUser} />)

    await user.click(await screen.findByRole('button', { name: '调整排期' }))
    fireEvent.change(document.querySelector('#quality-action-schedule') as HTMLInputElement, {
      target: { value: '2026-09-01T10:00' },
    })
    await user.type(screen.getByRole('textbox', { name: /调整原因/ }), '船期延后')
    await user.click(screen.getByRole('button', { name: '保存排期' }))

    await waitFor(() => {
      expect(rescheduleQualityInspection).toHaveBeenCalledWith('qc-task-001', {
        scheduled_at: '2026-09-01T10:00',
        reason: '船期延后',
      })
    })
  })

  it('按服务端分页请求且翻页后汇总指标不变', async () => {
    vi.mocked(listQualityInspections).mockResolvedValue({
      items: [pendingTask as QualityInspection],
      total: 120,
      summary: {
        pending_count: 5,
        in_progress_count: 2,
        completed_count: 100,
        cancelled_count: 1,
        overdue_count: 3,
        open_issue_count: 0,
        my_action_count: 5,
      },
    })
    const user = userEvent.setup()
    render(<MyQualityTasksPage currentUser={currentUser} />)

    await waitFor(() =>
      expect(listQualityInspections).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50, offset: 0, inspector_user_id: currentUser.id }),
      ),
    )
    const before = metricTexts()
    for (const value of [120, 5, 2, 100, 3]) {
      expect(before.some((text) => text?.endsWith(`: ${value}`))).toBe(true)
    }

    await user.click(screen.getByTitle('2'))

    await waitFor(() =>
      expect(listQualityInspections).toHaveBeenLastCalledWith(
        expect.objectContaining({ limit: 50, offset: 50 }),
      ),
    )
    expect(metricTexts()).toEqual(before)
  })
})
