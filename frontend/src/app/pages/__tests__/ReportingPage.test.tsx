import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// ── Mock App module (avoids window access during import) ─────────
vi.mock('../../App', () => ({
  t: (key: string, opts?: Record<string, unknown>) => opts?.count != null ? `${key}${opts.count}` : key,
}))

import { ReportingPage } from '../reporting/ReportingPage'

describe('ReportingPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing', () => {
    const { container } = render(<ReportingPage onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders summary strip', () => {
    render(<ReportingPage onNavigate={onNavigate} />)
    expect(screen.getByLabelText('经理查询概览')).toBeTruthy()
  })

  it('renders approval document query panel', () => {
    render(<ReportingPage onNavigate={onNavigate} />)
    expect(screen.getByText('审批单据查询')).toBeTruthy()
  })
})
