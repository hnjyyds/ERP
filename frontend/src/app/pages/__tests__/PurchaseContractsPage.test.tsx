import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PurchaseContractsPage } from '../purchase/PurchaseContractsPage'

describe('PurchaseContractsPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing', () => {
    const { container } = render(<PurchaseContractsPage detailId={undefined} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders purchase contract summary', () => {
    render(<PurchaseContractsPage detailId={undefined} onNavigate={onNavigate} />)
    expect(screen.getAllByText('采购合同').length).toBeGreaterThanOrEqual(1)
  })
})
