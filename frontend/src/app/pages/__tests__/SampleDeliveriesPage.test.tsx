import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SampleDeliveriesPage } from '../sample/SampleDeliveriesPage'

describe('SampleDeliveriesPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing', () => {
    const { container } = render(<SampleDeliveriesPage detailId={undefined} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders sample delivery list panel', () => {
    render(<SampleDeliveriesPage detailId={undefined} onNavigate={onNavigate} />)
    expect(screen.getByText('寄样单列表')).toBeTruthy()
  })
})
