import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TradingPartnerPage } from '../masterdata/TradingPartnerPage'

describe('TradingPartnerPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing', () => {
    const { container } = render(
      <TradingPartnerPage entityLabel="往来伙伴" onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders trading partner list panel', () => {
    render(<TradingPartnerPage entityLabel="往来伙伴" onNavigate={onNavigate} />)
    expect(screen.getByText('往来伙伴列表')).toBeTruthy()
  })
})
