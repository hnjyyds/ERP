import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OutboundOrdersPage } from '../warehouse/OutboundOrdersPage'

describe('OutboundOrdersPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = render(<OutboundOrdersPage detailId={undefined} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders summary strip with outbound order metrics', () => {
    render(<OutboundOrdersPage detailId={undefined} onNavigate={onNavigate} />)
    expect(screen.getByLabelText('货物出库概览')).toBeTruthy()
  })

  it('renders filter inputs', () => {
    render(<OutboundOrdersPage detailId={undefined} onNavigate={onNavigate} />)
    expect(screen.getByPlaceholderText('出库单 / 来源单 / 商品')).toBeTruthy()
    expect(screen.getByPlaceholderText('customer-id')).toBeTruthy()
    expect(screen.getByPlaceholderText('shipment-id')).toBeTruthy()
  })

  it('opens modal when 生成/审批出库单 button is clicked', async () => {
    const user = userEvent.setup()
    render(<OutboundOrdersPage detailId={undefined} onNavigate={onNavigate} />)
    const openButton = screen.getByText('生成/审批出库单')
    await user.click(openButton)
    expect(screen.getByText('出库单生成和审批')).toBeTruthy()
  })

  it('renders without detail view when no detailId', () => {
    render(<OutboundOrdersPage detailId={undefined} onNavigate={onNavigate} />)
    expect(screen.queryByText('出库明细和库存流水')).toBeFalsy()
  })
})
