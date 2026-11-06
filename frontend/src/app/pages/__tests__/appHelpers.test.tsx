import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import type { CurrentUser } from '../../../api'
import { canApproveAssignedRecord, severityTag } from '../appHelpers'

function currentUser(permissions: string[]): CurrentUser {
  return {
    id: 'u-boss',
    username: 'boss',
    display_name: '老板',
    department_name: '管理层',
    avatar_type: 'preset',
    avatar_value: 'amber-orbit',
    roles: ['测试角色'],
    permissions,
  }
}

describe('canApproveAssignedRecord', () => {
  it('allows a super admin to override an assigned reviewer', () => {
    expect(
      canApproveAssignedRecord(
        currentUser(['system:super_admin', 'sales:contract:approve']),
        'u-assigned-reviewer',
        'sales:contract:approve',
      ),
    ).toBe(true)
  })

  it('does not allow a regular approver to override an assigned reviewer', () => {
    expect(
      canApproveAssignedRecord(
        currentUser(['sales:contract:approve']),
        'u-assigned-reviewer',
        'sales:contract:approve',
      ),
    ).toBe(false)
  })
})

describe('severityTag', () => {
  it('将消息级别显示为中文业务标签', () => {
    render(severityTag('warning'))
    expect(screen.getByText('提醒')).toBeInTheDocument()
  })
})
