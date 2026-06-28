import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FollowupPage } from '../purchase/FollowupPage'

describe('FollowupPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing', () => {
    const { container } = render(<FollowupPage detailId={undefined} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders followup list panel', () => {
    render(<FollowupPage detailId={undefined} onNavigate={onNavigate} />)
    expect(screen.getByText('采购跟单计划')).toBeTruthy()
  })
})
