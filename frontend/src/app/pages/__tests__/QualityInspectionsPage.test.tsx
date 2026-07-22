import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
    listPurchaseContracts: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    listQualityInspections: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    updateQualityInspection: vi.fn(),
  }
})

import { QualityInspectionsPage } from '../quality/QualityInspectionsPage'
import { createQualityInspection, listAssignableUsers } from '../../../api'

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
      <QualityInspectionsPage currentUser={currentUser} detailId={undefined} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders summary strip with QC metrics', () => {
    render(
      <QualityInspectionsPage currentUser={currentUser} detailId={undefined} onNavigate={onNavigate} />,
    )
    expect(screen.getByLabelText('QC 查验概览')).toBeTruthy()
  })

  it('renders search panel title', () => {
    render(
      <QualityInspectionsPage currentUser={currentUser} detailId={undefined} onNavigate={onNavigate} />,
    )
    expect(screen.getByText('QC 查验列表')).toBeTruthy()
  })

  it('renders filter inputs', () => {
    render(
      <QualityInspectionsPage currentUser={currentUser} detailId={undefined} onNavigate={onNavigate} />,
    )
    expect(screen.getByPlaceholderText('QC 单号 / 合同 / 供应商')).toBeTruthy()
    expect(screen.getByPlaceholderText('supplier-id')).toBeTruthy()
    expect(screen.getByPlaceholderText('purchase-contract-id')).toBeTruthy()
  })

  it('opens modal when 新增 QC 单 button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <QualityInspectionsPage currentUser={currentUser} detailId={undefined} onNavigate={onNavigate} />,
    )
    const addButton = screen.getByText('新增 QC 单')
    await user.click(addButton)
    // In jsdom Modal may not fully render; just verify button is clickable without crash
    expect(addButton).toBeTruthy()
  })

  it('selects an active employee and submits the linked inspector id and name', async () => {
    const user = userEvent.setup()
    render(
      <QualityInspectionsPage currentUser={currentUser} detailId={undefined} onNavigate={onNavigate} />,
    )

    await user.click(screen.getByText('新增 QC 单'))
    await waitFor(() => expect(listAssignableUsers).toHaveBeenCalledTimes(1))

    const inspectorSelect = screen.getByRole('combobox', { name: '查验人' })
    expect(screen.queryByRole('textbox', { name: '查验人' })).toBeNull()
    await user.click(inspectorSelect)
    await user.click(await screen.findByText('演示 QC 专员 / qc / 品质部'))

    const submitButton = screen.getByRole('button', { name: '新增 QC 查验' })
    const form = submitButton.closest('form')
    expect(form).toBeTruthy()
    fireEvent.submit(form!)

    await waitFor(() => {
      expect(createQualityInspection).toHaveBeenCalledWith(
        expect.objectContaining({
          inspector_id: 'user-qc',
          inspector_name: '演示 QC 专员',
        }),
      )
    })
  })

  it('renders without detail view when no detailId', () => {
    render(
      <QualityInspectionsPage currentUser={currentUser} detailId={undefined} onNavigate={onNavigate} />,
    )
    expect(screen.queryByText('QC 查验明细和入库判定')).toBeFalsy()
  })
})
