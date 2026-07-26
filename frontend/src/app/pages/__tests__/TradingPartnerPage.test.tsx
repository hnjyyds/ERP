import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  TradingPartnerPage,
  type TradingPartnerPageProps,
} from '../masterdata/TradingPartnerPage'

const unusedMutation = vi.fn(async () => {
  throw new Error('not used in render test')
})

const defaultProps: TradingPartnerPageProps = {
  className: 'partner-page',
  entityLabel: '往来伙伴',
  pageTitle: '往来伙伴列表',
  searchPlaceholder: '搜索往来伙伴',
  createPrefix: 'PARTNER',
  kind: 'partner',
  detailId: null,
  listPath: '/masterdata/partners',
  detailPath: (id) => `/masterdata/partners/${id}`,
  onNavigate: vi.fn(),
  listEntity: vi.fn(async () => ({ items: [], total: 0 })),
  createEntity: unusedMutation,
  updateEntity: unusedMutation,
  deactivateEntity: unusedMutation,
  addContact: unusedMutation,
  updateContact: unusedMutation,
  deleteContact: unusedMutation,
  listTransactions: vi.fn(async () => ({ items: [], total: 0 })),
}

describe('TradingPartnerPage', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders without crashing', () => {
    const { container } = render(
      <TradingPartnerPage {...defaultProps} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders trading partner list panel', () => {
    render(<TradingPartnerPage {...defaultProps} />)
    expect(screen.getByText('往来伙伴列表')).toBeTruthy()
  })
})
