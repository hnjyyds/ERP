import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>()
  return {
    ...actual,
    listAuditLogs: vi.fn(),
    exportAuditLogs: vi.fn(),
  }
})

vi.mock('@/shared/print', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/print')>()
  return { ...actual, downloadCsv: vi.fn() }
})

import { AuditLogsPage } from '@/app/pages/system/AuditLogsPage'
import { setRuntimeSettings } from '@/app/pages/appHelpers'
import { exportAuditLogs, listAuditLogs, type AuditLogItem } from '@/api'
import { downloadCsv } from '@/shared/print'

const auditFixture: AuditLogItem = {
  id: 'audit-1',
  actor_user_id: 'u-finance',
  actor_name: '财务演示',
  action: 'submit',
  resource_type: 'reimbursement',
  resource_id: 'rb-1',
  resource_no: 'RB-AUDIT-001',
  summary: '提交报销单',
  payload: null,
  created_at: '2026-11-09T08:30:00',
}

describe('AuditLogsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setRuntimeSettings({ language: 'zh-CN', timeZone: 'Asia/Shanghai' })
    vi.mocked(listAuditLogs).mockResolvedValue({ items: [auditFixture], total: 1 })
    vi.mocked(exportAuditLogs).mockResolvedValue({
      filename: 'audit-logs.csv',
      content_type: 'text/csv',
      content: '时间,操作人\n2026-11-09,财务演示',
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders audit records with localized module and action', async () => {
    render(<AuditLogsPage />)

    expect(await screen.findByText('提交报销单')).toBeInTheDocument()
    expect(screen.getByText('RB-AUDIT-001')).toBeInTheDocument()
    expect(screen.getByText('报销')).toBeInTheDocument()
    expect(screen.getAllByText('提交').length).toBeGreaterThan(0)
    expect(screen.getByText('财务演示')).toBeInTheDocument()
  })

  it('searches by document number keyword', async () => {
    render(<AuditLogsPage />)
    await screen.findByText('提交报销单')

    await userEvent.type(screen.getByPlaceholderText('输入单号关键字'), 'RB-AUDIT')
    await userEvent.click(screen.getByRole('button', { name: /查\s*询/ }))

    await waitFor(() => {
      expect(listAuditLogs).toHaveBeenLastCalledWith(
        expect.objectContaining({ keyword: 'RB-AUDIT', limit: 50, offset: 0 }),
      )
    })
  })

  it('exports current filter result as CSV', async () => {
    render(<AuditLogsPage />)
    await screen.findByText('提交报销单')

    await userEvent.click(screen.getByRole('button', { name: '导出 CSV' }))

    await waitFor(() => {
      expect(exportAuditLogs).toHaveBeenCalledWith(expect.not.objectContaining({ limit: 50 }))
      expect(downloadCsv).toHaveBeenCalledWith('audit-logs.csv', expect.stringContaining('财务演示'))
    })
  })
})
