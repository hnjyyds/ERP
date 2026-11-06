import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ShipmentsPage } from '../sales/ShipmentsPage'

describe('ShipmentsPage', () => {
  const onNavigate = vi.fn()
  const currentUser = {
    id: 'u-admin',
    username: 'admin',
    display_name: '管理员',
    department_name: '管理部',
    avatar_type: 'preset' as const,
    avatar_value: 'blue',
    roles: ['admin'],
    permissions: ['system:super_admin'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = render(
      <ShipmentsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders shipment list panel', () => {
    render(<ShipmentsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByText('出货计划列表')).toBeTruthy()
  })

  it('uses business-readable selectors for shipment contracts', () => {
    render(<ShipmentsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)

    fireEvent.click(screen.getByRole('button', { name: '生成出货明细' }))

    expect(screen.getByLabelText('出口合同 A')).toHaveAttribute('role', 'combobox')
    expect(screen.getByLabelText('出口合同 B（可选）')).toHaveAttribute('role', 'combobox')
    expect(screen.queryByLabelText('合同标识 A')).not.toBeInTheDocument()
  })
})
