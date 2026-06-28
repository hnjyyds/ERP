import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExportQuotationsPage } from '../sales/ExportQuotationsPage'

describe('ExportQuotationsPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing', () => {
    const { container } = render(<ExportQuotationsPage detailId={undefined} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders quotation list panel', () => {
    render(<ExportQuotationsPage detailId={undefined} onNavigate={onNavigate} />)
    expect(screen.getByText('报价单列表')).toBeTruthy()
  })
})
