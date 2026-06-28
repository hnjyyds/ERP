import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PurchaseInvoiceNoticesPage } from '../purchase/PurchaseInvoiceNoticesPage'

describe('PurchaseInvoiceNoticesPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing', () => {
    const { container } = render(<PurchaseInvoiceNoticesPage detailId={undefined} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders invoice notice list panel', () => {
    render(<PurchaseInvoiceNoticesPage detailId={undefined} onNavigate={onNavigate} />)
    expect(screen.getByText('开票通知列表')).toBeTruthy()
  })
})
