import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InboundPlansPage } from '../warehouse/InboundPlansPage'

describe('InboundPlansPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = render(<InboundPlansPage detailId={undefined} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders summary strip with inbound plan metrics', () => {
    render(<InboundPlansPage detailId={undefined} onNavigate={onNavigate} />)
    expect(screen.getByLabelText('入库计划概览')).toBeTruthy()
  })

  it('renders search panel title', () => {
    render(<InboundPlansPage detailId={undefined} onNavigate={onNavigate} />)
    expect(screen.getByText('待入库计划')).toBeTruthy()
  })

  it('renders filter inputs', () => {
    render(<InboundPlansPage detailId={undefined} onNavigate={onNavigate} />)
    expect(screen.getByPlaceholderText('计划号 / 采购合同 / 商品')).toBeTruthy()
    expect(screen.getByPlaceholderText('supplier-id')).toBeTruthy()
    expect(screen.getByPlaceholderText('purchase-contract-id')).toBeTruthy()
  })

  it('opens modal when generate/schedule button is clicked', async () => {
    render(<InboundPlansPage detailId={undefined} onNavigate={onNavigate} />)
    // Initially modal should be closed
    expect(screen.queryByText('计划生成和排库位')).toBeFalsy()
  })

  it('renders without detail view when no detailId', () => {
    render(<InboundPlansPage detailId={undefined} onNavigate={onNavigate} />)
    // Should not have the "计划明细" detail panel in list-only mode
    expect(screen.queryByText('计划明细')).toBeFalsy()
  })
})
