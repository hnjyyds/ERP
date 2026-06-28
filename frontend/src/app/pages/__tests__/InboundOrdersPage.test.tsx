import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InboundOrdersPage } from '../warehouse/InboundOrdersPage'

describe('InboundOrdersPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = render(<InboundOrdersPage detailId={undefined} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders summary strip with inbound order metrics', () => {
    render(<InboundOrdersPage detailId={undefined} onNavigate={onNavigate} />)
    expect(screen.getByLabelText('货物入库概览')).toBeTruthy()
  })

  it('renders search panel title', () => {
    render(<InboundOrdersPage detailId={undefined} onNavigate={onNavigate} />)
    // "入库单" appears in metric label, panel title, and table header
    expect(screen.getAllByText('入库单').length).toBeGreaterThan(0)
  })

  it('renders filter inputs', () => {
    render(<InboundOrdersPage detailId={undefined} onNavigate={onNavigate} />)
    expect(screen.getByPlaceholderText('入库单 / 采购合同 / 商品')).toBeTruthy()
    expect(screen.getByPlaceholderText('supplier-id')).toBeTruthy()
    expect(screen.getByPlaceholderText('purchase-contract-id')).toBeTruthy()
  })

  it('opens modal when 生成/审批入库单 button is clicked', async () => {
    const user = userEvent.setup()
    render(<InboundOrdersPage detailId={undefined} onNavigate={onNavigate} />)
    const openButton = screen.getByText('生成/审批入库单')
    await user.click(openButton)
    expect(screen.getByText('入库单生成和审批')).toBeTruthy()
  })

  it('renders without detail view when no detailId', () => {
    render(<InboundOrdersPage detailId={undefined} onNavigate={onNavigate} />)
    expect(screen.queryByText('明细和库存')).toBeFalsy()
  })
})
