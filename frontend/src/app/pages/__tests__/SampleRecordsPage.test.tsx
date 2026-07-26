import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SampleRecordsPage } from '../sample/SampleRecordsPage'

describe('SampleRecordsPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing', () => {
    const { container } = render(<SampleRecordsPage detailId={null} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders sample record list panel', () => {
    render(<SampleRecordsPage detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByText('样品列表')).toBeTruthy()
  })
})
