import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DocumentPartiesPage } from '../masterdata/DocumentPartiesPage'

describe('DocumentPartiesPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing', () => {
    const { container } = render(<DocumentPartiesPage detailId={null} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders document parties list panel', () => {
    render(<DocumentPartiesPage detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByText('单证资料')).toBeTruthy()
  })
})
