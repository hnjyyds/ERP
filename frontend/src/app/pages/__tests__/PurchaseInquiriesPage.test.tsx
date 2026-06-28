import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PurchaseInquiriesPage } from '../purchase/PurchaseInquiriesPage'

describe('PurchaseInquiriesPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing', () => {
    const { container } = render(<PurchaseInquiriesPage detailId={undefined} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders purchase inquiry list panel', () => {
    render(<PurchaseInquiriesPage detailId={undefined} onNavigate={onNavigate} />)
    expect(screen.getByText('采购询价列表')).toBeTruthy()
  })
})
