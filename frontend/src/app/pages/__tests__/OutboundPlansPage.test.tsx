import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OutboundPlansPage } from '../warehouse/OutboundPlansPage'

describe('OutboundPlansPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = render(<OutboundPlansPage detailId={undefined} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders summary strip with outbound plan metrics', () => {
    render(<OutboundPlansPage detailId={undefined} onNavigate={onNavigate} />)
    expect(screen.getByLabelText('出库计划概览')).toBeTruthy()
  })

  it('renders filter inputs', () => {
    render(<OutboundPlansPage detailId={undefined} onNavigate={onNavigate} />)
    expect(screen.getByPlaceholderText('计划号 / 来源单 / 商品')).toBeTruthy()
    expect(screen.getByPlaceholderText('customer-id')).toBeTruthy()
    expect(screen.getByPlaceholderText('shipment-id')).toBeTruthy()
  })

  it('renders without detail view when no detailId', () => {
    render(<OutboundPlansPage detailId={undefined} onNavigate={onNavigate} />)
    expect(screen.queryByText('待出库清单')).toBeFalsy()
  })
})
