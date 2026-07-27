import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api')>()
  return {
    ...actual,
    createQualityInspection: vi.fn().mockRejectedValue(new Error('stop after payload capture')),
    getQualityInboundEligibility: vi.fn().mockResolvedValue(null),
    listAssignableUsers: vi.fn().mockResolvedValue({
      users: [
        {
          id: 'user-qc',
          username: 'qc',
          display_name: '演示 QC 专员',
          department_name: '品质部',
          avatar_type: 'preset',
          avatar_value: 'rose-signal',
        },
      ],
    }),
    listPurchaseContracts: vi.fn().mockResolvedValue({
      items: [
        {
          id: 'pc-001',
          code: 'PC-QC-001',
          supplier_name: '华东包装制品厂',
          contract_date: '2026-08-05',
          delivery_date: '2026-08-30',
        },
      ],
      total: 1,
    }),
    listQualityInspections: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    updateQualityInspection: vi.fn(),
  }
})

import { QualityInspectionsPage } from '../quality/QualityInspectionsPage'
import { createQualityInspection, listAssignableUsers, listPurchaseContracts } from '../../../api'

describe('QualityInspectionsPage', () => {
  const onNavigate = vi.fn()
  const currentUser = {
    id: 'user-current',
    username: 'current-qc',
    display_name: '当前 QC',
    department_name: '品质部',
    avatar_type: 'preset' as const,
    avatar_value: 'rose-signal',
    roles: ['QC 专员'],
    permissions: ['quality:inspection:edit'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = render(
      <QualityInspectionsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders summary strip with QC metrics', () => {
    render(
      <QualityInspectionsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )
    expect(screen.getByLabelText('QC 任务概览')).toBeTruthy()
  })

  it('renders search panel title', () => {
    render(
      <QualityInspectionsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )
    expect(screen.getByText('QC 任务列表')).toBeTruthy()
  })

  it('renders filter inputs', () => {
    render(
      <QualityInspectionsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )
    expect(screen.getByPlaceholderText('QC 单号 / 合同 / 供应商')).toBeTruthy()
    expect(screen.getByPlaceholderText('supplier-id')).toBeTruthy()
    expect(screen.getByPlaceholderText('purchase-contract-id')).toBeTruthy()
  })

  it('opens a task-only modal without inspection result fields', async () => {
    const user = userEvent.setup()
    render(
      <QualityInspectionsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )
    const addButton = screen.getByText('新增 QC 单')
    await user.click(addButton)
    const modal = screen.getByText('建立 QC 任务').closest<HTMLElement>('.ant-modal')
    expect(modal).toBeTruthy()
    expect(modal!.querySelector('#quality-scheduled-at')).toBeTruthy()
    expect(within(modal!).queryByText('查验结果')).toBeNull()
    expect(within(modal!).queryByText('查验明细')).toBeNull()
  })

  it('creates a scheduled pending task for the selected employee without a result', async () => {
    const user = userEvent.setup()
    render(
      <QualityInspectionsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )

    await user.click(screen.getByText('新增 QC 单'))
    await waitFor(() => expect(listAssignableUsers).toHaveBeenCalledTimes(1))

    const contractSelect = screen.getByRole('combobox', { name: '采购合同' })
    await user.click(contractSelect)
    await user.click(await screen.findByText('PC-QC-001 / 华东包装制品厂'))
    expect(listPurchaseContracts).toHaveBeenCalledWith(
      expect.objectContaining({ approval_status: 'approved' }),
    )

    const inspectorSelect = screen.getByRole('combobox', { name: '负责人' })
    expect(screen.queryByRole('textbox', { name: '负责人' })).toBeNull()
    await user.click(inspectorSelect)
    await user.click(await screen.findByText('演示 QC 专员 / qc / 品质部'))

    const scheduledAtInput = document.querySelector<HTMLInputElement>('#quality-scheduled-at')
    expect(scheduledAtInput).toBeTruthy()
    fireEvent.input(scheduledAtInput!, {
      target: { value: '2026-08-26T09:00' },
    })

    const submitButton = screen.getByRole('button', { name: '创建 QC 任务' })
    const form = submitButton.closest('form')
    expect(form).toBeTruthy()
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(createQualityInspection).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
          scheduled_at: '2026-08-26T09:00',
          inspector_id: 'user-qc',
          inspector_name: '演示 QC 专员',
          inspected_at: null,
          result: null,
          lines: [],
          issues: [],
        }),
      )
    })
  })

  it('lists the missing required fields and does not submit an incomplete inspection', async () => {
    const user = userEvent.setup()
    render(
      <QualityInspectionsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )

    await user.click(screen.getByText('新增 QC 单'))
    const submitButton = screen.getByRole('button', { name: '创建 QC 任务' })
    const form = submitButton.closest('form')
    expect(form).toBeTruthy()
    fireEvent.submit(form!)

    expect(await screen.findByText('请完善以下 1 项信息')).toBeTruthy()
    expect(screen.getByText('采购合同：请选择采购合同')).toBeTruthy()
    expect(screen.getByRole('combobox', { name: '采购合同' }).getAttribute('aria-invalid')).toBe(
      'true',
    )
    expect(screen.getByText('采购合同', { selector: '.form-field-label' }).textContent).toContain(
      '*',
    )
    expect(createQualityInspection).not.toHaveBeenCalled()
  })

  it('renders without detail view when no detailId', () => {
    render(
      <QualityInspectionsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )
    expect(screen.queryByText('QC 查验明细和入库判定')).toBeFalsy()
  })
})
