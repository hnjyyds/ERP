import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SampleRequestsPage } from '../sample/SampleRequestsPage'

describe('SampleRequestsPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing', () => {
    const { container } = render(<SampleRequestsPage detailId={undefined} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders sample request list panel', () => {
    render(<SampleRequestsPage detailId={undefined} onNavigate={onNavigate} />)
    expect(screen.getByText('打样单列表')).toBeTruthy()
  })
})
