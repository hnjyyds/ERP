import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InboundPlansPage } from '../warehouse/InboundPlansPage'

describe('InboundPlansPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = render(<InboundPlansPage detailId={null} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders summary strip with inbound plan metrics', () => {
    render(<InboundPlansPage detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByLabelText('入库计划概览')).toBeTruthy()
  })

  it('renders search panel title', () => {
    render(<InboundPlansPage detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByText('待入库计划')).toBeTruthy()
  })

  it('renders filter inputs', () => {
    render(<InboundPlansPage detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByPlaceholderText('计划号 / 采购合同 / 商品')).toBeTruthy()
    expect(screen.getByPlaceholderText('输入供应商编号或名称')).toBeTruthy()
    expect(screen.getByPlaceholderText('输入采购合同号')).toBeTruthy()
  })

  it('opens modal when generate/schedule button is clicked', async () => {
    const user = userEvent.setup()
    render(<InboundPlansPage detailId={null} onNavigate={onNavigate} />)
    expect(screen.queryByText('计划生成和排库位')).toBeFalsy()

    await user.click(screen.getByRole('button', { name: '生成/排库位' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByLabelText('采购合同')).toHaveAttribute('role', 'combobox')
    expect(within(dialog).queryByLabelText('采购合同 ID')).not.toBeInTheDocument()
  })

  it('renders without detail view when no detailId', () => {
    render(<InboundPlansPage detailId={null} onNavigate={onNavigate} />)
    // Should not have the "计划明细" detail panel in list-only mode
    expect(screen.queryByText('计划明细')).toBeFalsy()
  })
})
