import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { FinancePage } from '../finance/FinancePage'
import type { CurrentUser } from '../../../api'

const currentUser: CurrentUser = {
  id: 'u-finance',
  username: 'finance',
  display_name: '演示财务',
  department_name: '财务部',
  avatar_type: 'preset',
  avatar_value: 'sage-pulse',
  roles: ['finance'],
  permissions: ['finance:view'],
}

describe('FinancePage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing (home view)', () => {
    const { container } = render(
      <FinancePage currentUser={currentUser} view={{ module: 'home', id: null }} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders overview view', () => {
    const { container } = render(
      <FinancePage currentUser={currentUser} view={{ module: 'overview', id: null }} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders receipts view', () => {
    const { container } = render(
      <FinancePage currentUser={currentUser} view={{ module: 'receipts', id: null }} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders payments view', () => {
    const { container } = render(
      <FinancePage currentUser={currentUser} view={{ module: 'payments', id: null }} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })
})
