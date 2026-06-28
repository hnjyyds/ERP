import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OrganizationUsersPage } from '../organization/OrganizationUsersPage'
import type { CurrentUser } from '../../../api'

const mockCurrentUser: CurrentUser = {
  id: 'test-user-id',
  username: 'testuser',
  display_name: 'Test User',
  department_name: 'Engineering',
  avatar_type: 'initials',
  avatar_value: 'TU',
  roles: [],
  permissions: ['superadmin'],
}

describe('OrganizationUsersPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing', () => {
    const { container } = render(
      <OrganizationUsersPage currentUser={mockCurrentUser} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders search input', () => {
    render(<OrganizationUsersPage currentUser={mockCurrentUser} onNavigate={onNavigate} />)
    expect(screen.getByPlaceholderText('搜索用户、部门或角色')).toBeTruthy()
  })
})
