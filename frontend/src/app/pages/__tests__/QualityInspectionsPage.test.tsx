import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api')>()
  return {
    ...actual,
    createQualityInspection: vi.fn().mockRejectedValue(new Error('stop after payload capture')),
    createQualityReinspection: vi.fn(),
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
    resolveQualityIssue: vi.fn(),
    updateQualityInspection: vi.fn(),
  }
})

import { QualityInspectionsPage } from '../quality/QualityInspectionsPage'
import {
  createQualityInspection,
  createQualityReinspection,
  getQualityInboundEligibility,
  listAssignableUsers,
  listPurchaseContracts,
  listQualityInspections,
  resolveQualityIssue,
} from '../../../api'

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

  it('closes an exception before creating a reinspection task', async () => {
    const user = userEvent.setup()
    const failedInspection = {
      id: 'qc-failed-001',
      code: 'QC-FAILED-001',
      purchase_contract_id: 'pc-001',
      purchase_contract_no: 'PC-QC-001',
      supplier_id: 'supplier-001',
      supplier_name: '华东包装制品厂',
      status: 'completed' as const,
      scheduled_at: '2026-08-20T09:00:00',
      inspected_at: '2026-08-20',
      result: 'failed',
      inspector_id: 'user-qc',
      inspector_name: '演示 QC 专员',
      qc_user_id: 'user-qc',
      qc_user_name: '演示 QC 专员',
      issue_summary: null,
      attachment_group_id: null,
      owner_user_id: 'user-current',
      lines: [],
      issues: [
        {
          id: 'issue-001',
          inspection_id: 'qc-failed-001',
          line_id: null,
          issue_type: '包装破损',
          severity: 'major',
          description: '包装破损 10 件',
          corrective_action: '重新包装',
          status: 'open',
          attachment_group_id: null,
          attachments: [],
        },
      ],
      attachments: [],
      events: [],
    }
    const resolvedInspection = {
      ...failedInspection,
      issues: [
        {
          ...failedInspection.issues[0],
          status: 'resolved',
          resolution_note: '供应商已重新包装',
        },
      ],
    }
    vi.mocked(listQualityInspections).mockResolvedValueOnce({
      items: [failedInspection],
      total: 1,
    })
    vi.mocked(resolveQualityIssue).mockResolvedValueOnce(resolvedInspection)
    vi.mocked(getQualityInboundEligibility).mockResolvedValueOnce({
      purchase_contract_id: failedInspection.purchase_contract_id,
      eligible: false,
      latest_inspection_id: failedInspection.id,
      latest_status: 'completed',
      latest_result: 'failed',
      inspected_at: failedInspection.inspected_at,
      reason: '最近一次 QC 未通过',
    })
    vi.mocked(createQualityReinspection).mockResolvedValueOnce({
      ...resolvedInspection,
      id: 'qc-recheck-001',
      code: 'QC-RECHECK-001',
      status: 'pending',
      inspected_at: null,
      result: null,
      issues: [],
      parent_inspection_id: failedInspection.id,
      reinspection_no: 1,
    })
    render(
      <QualityInspectionsPage
        currentUser={currentUser}
        detailId={failedInspection.id}
        onNavigate={onNavigate}
      />,
    )

    await user.click(await screen.findByRole('button', { name: '关闭异常' }))
    await user.type(screen.getByRole('textbox', { name: '关闭说明' }), '供应商已重新包装')
    await user.click(screen.getByRole('button', { name: '确认关闭异常' }))
    await waitFor(() => {
      expect(resolveQualityIssue).toHaveBeenCalledWith(
        failedInspection.id,
        'issue-001',
        expect.objectContaining({ resolution_note: '供应商已重新包装' }),
      )
    })

    const reinspectionButton = await screen.findByRole('button', { name: '发起复检' })
    expect(reinspectionButton).not.toBeDisabled()
    await user.click(reinspectionButton)
    await user.click(screen.getByRole('button', { name: '创建复检任务' }))
    await waitFor(() => {
      expect(createQualityReinspection).toHaveBeenCalledWith(
        failedInspection.id,
        expect.objectContaining({ inspector_id: 'user-qc' }),
      )
    })
  })

  it('does not offer reinspection from a stale failed task', async () => {
    const staleInspection = {
      id: 'qc-failed-old',
      code: 'QC-FAILED-OLD',
      purchase_contract_id: 'pc-001',
      purchase_contract_no: 'PC-QC-001',
      supplier_id: 'supplier-001',
      supplier_name: '华东包装制品厂',
      status: 'completed' as const,
      scheduled_at: '2026-08-20T09:00:00',
      inspected_at: '2026-08-20',
      result: 'failed',
      inspector_id: 'user-qc',
      inspector_name: '演示 QC 专员',
      qc_user_id: 'user-qc',
      qc_user_name: '演示 QC 专员',
      issue_summary: null,
      attachment_group_id: null,
      owner_user_id: 'user-current',
      lines: [],
      issues: [
        {
          id: 'issue-old',
          inspection_id: 'qc-failed-old',
          line_id: null,
          issue_type: '包装破损',
          severity: 'major',
          description: '已整改',
          corrective_action: '重新包装',
          status: 'resolved',
          attachment_group_id: null,
          attachments: [],
        },
      ],
      attachments: [],
      events: [],
    }
    vi.mocked(listQualityInspections).mockResolvedValueOnce({
      items: [staleInspection],
      total: 1,
    })
    vi.mocked(getQualityInboundEligibility).mockResolvedValueOnce({
      purchase_contract_id: staleInspection.purchase_contract_id,
      eligible: true,
      latest_inspection_id: 'qc-recheck-new',
      latest_status: 'completed',
      latest_result: 'passed',
      inspected_at: '2026-08-22',
      reason: 'QC 已通过',
    })

    render(
      <QualityInspectionsPage
        currentUser={currentUser}
        detailId={staleInspection.id}
        onNavigate={onNavigate}
      />,
    )

    expect(
      await screen.findByText('该任务不是合同最新 QC，不能重复发起复检'),
    ).toBeTruthy()
    expect(screen.queryByRole('button', { name: '发起复检' })).toBeNull()
  })
})
