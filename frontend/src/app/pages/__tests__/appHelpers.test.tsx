import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import type { CurrentUser } from '../../../api'
import { t } from '../../appI18n'
import {
  canApproveAssignedRecord,
  formatDate,
  severityTag,
  setRuntimeSettings,
} from '../appHelpers'

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

describe('runtime settings', () => {
  afterEach(() => {
    setRuntimeSettings({ language: 'zh-CN', timeZone: 'Asia/Shanghai' })
  })

  it('让 t 跟随运行时语言设置', () => {
    setRuntimeSettings({ language: 'en-US', timeZone: 'UTC' })
    expect(t('settings.title')).toBe('Settings')
  })

  it('让日期格式化跟随运行时设置的时区', () => {
    const value = '2024-01-01T20:00:00Z'
    expect(formatDate(value)).toBe('2024-01-02')
    setRuntimeSettings({ language: 'en-US', timeZone: 'UTC' })
    expect(formatDate(value)).toBe('2024-01-01')
  })
})

