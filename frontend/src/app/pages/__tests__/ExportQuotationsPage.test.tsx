import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExportQuotationsPage } from '../sales/ExportQuotationsPage'

describe('ExportQuotationsPage', () => {
  const onNavigate = vi.fn()
  const currentUser = { id: 'u-admin', username: 'admin', display_name: '管理员', department_name: '管理部', avatar_type: 'preset' as const, avatar_value: 'blue', roles: ['admin'], permissions: ['system:super_admin'] }

  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing', () => {
    const { container } = render(<ExportQuotationsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders quotation list panel', () => {
    render(<ExportQuotationsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByText('报价单列表')).toBeTruthy()
  })
})
