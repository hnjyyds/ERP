import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { FinancePage } from '../finance/FinancePage'

describe('FinancePage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing (home view)', () => {
    const { container } = render(
      <FinancePage view={{ module: 'home', id: null }} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders overview view', () => {
    const { container } = render(
      <FinancePage view={{ module: 'overview', id: null }} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders receipts view', () => {
    const { container } = render(
      <FinancePage view={{ module: 'receipts', id: null }} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders payments view', () => {
    const { container } = render(
      <FinancePage view={{ module: 'payments', id: null }} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })
})
