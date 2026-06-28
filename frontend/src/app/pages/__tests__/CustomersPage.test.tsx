import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

vi.mock('../masterdata/TradingPartnerPage', () => ({
  TradingPartnerPage: () => <div data-testid="trading-partner-page" />,
}))

import { CustomersPage } from '../masterdata/CustomersPage'

describe('CustomersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = render(
      <CustomersPage detailId={null} onNavigate={vi.fn()} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders with detailId', () => {
    const { container } = render(
      <CustomersPage detailId="cust-001" onNavigate={vi.fn()} />,
    )
    expect(container).toBeTruthy()
  })
})
