import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

vi.mock('../masterdata/TradingPartnerPage', () => ({
  TradingPartnerPage: () => <div data-testid="trading-partner-page" />,
}))

import { PartnersPage } from '../masterdata/PartnersPage'

describe('PartnersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = render(
      <PartnersPage detailId={null} onNavigate={vi.fn()} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders with detailId', () => {
    const { container } = render(
      <PartnersPage detailId="part-001" onNavigate={vi.fn()} />,
    )
    expect(container).toBeTruthy()
  })
})
