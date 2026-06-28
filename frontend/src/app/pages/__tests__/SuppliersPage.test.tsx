import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

vi.mock('../masterdata/TradingPartnerPage', () => ({
  TradingPartnerPage: () => <div data-testid="trading-partner-page" />,
}))

import { SuppliersPage } from '../masterdata/SuppliersPage'

describe('SuppliersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = render(
      <SuppliersPage detailId={null} onNavigate={vi.fn()} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders with detailId', () => {
    const { container } = render(
      <SuppliersPage detailId="supp-001" onNavigate={vi.fn()} />,
    )
    expect(container).toBeTruthy()
  })
})
