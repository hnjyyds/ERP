import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PurchaseContractsPage } from '../purchase/PurchaseContractsPage'

describe('PurchaseContractsPage', () => {
  const onNavigate = vi.fn()
  const currentUser = { id: 'u-admin', username: 'admin', display_name: '管理员', department_name: '管理部', avatar_type: 'preset' as const, avatar_value: 'blue', roles: ['admin'], permissions: ['system:super_admin'] }

  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing', () => {
    const { container } = render(<PurchaseContractsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders purchase contract summary', () => {
    render(<PurchaseContractsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    expect(screen.getAllByText('采购合同').length).toBeGreaterThanOrEqual(1)
  })
})
