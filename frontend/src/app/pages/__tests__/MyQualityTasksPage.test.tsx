import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
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

vi.mock('../../../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api')>()
  return {
    ...actual,
    listQualityInspections: vi.fn().mockResolvedValue({
      items: [pendingTask],
      total: 1,
    }),
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

import { listQualityInspections, updateQualityInspection } from '../../../api'
import { MyQualityTasksPage } from '../quality/MyQualityTasksPage'

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
  })

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
    })
    render(<MyQualityTasksPage currentUser={currentUser} />)

    await user.click(await screen.findByRole('button', { name: '登记结果' }))

    expect(await screen.findByRole('textbox', { name: '商品名称' })).toHaveValue('Eco Shopping Bag')
    expect(screen.getByRole('spinbutton', { name: '查验数量' })).toHaveValue(120)
    expect(screen.getByRole('textbox', { name: '单位' })).toHaveValue('pcs')
  })
})
