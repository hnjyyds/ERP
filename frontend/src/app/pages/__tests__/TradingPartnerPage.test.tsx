import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('默认使用紧凑工具栏并按需展开高级筛选', async () => {
    render(<TradingPartnerPage {...defaultProps} />)

    expect(screen.getByRole('button', { name: '查询往来伙伴' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '新增往来伙伴' })).toBeInTheDocument()
    expect(screen.queryByLabelText('往来伙伴高级筛选')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '高级筛选' }))

    expect(screen.getByLabelText('往来伙伴高级筛选')).toBeInTheDocument()
    expect(screen.getByLabelText('国家/地区')).toBeInTheDocument()
    expect(screen.getByLabelText('类型')).toBeInTheDocument()
    expect(screen.getByLabelText('状态')).toBeInTheDocument()
  })

  it('显示已启用的高级筛选数量并可以重置', async () => {
    render(<TradingPartnerPage {...defaultProps} />)

    await userEvent.click(screen.getByRole('button', { name: '高级筛选' }))
    await userEvent.type(screen.getByLabelText('国家/地区'), '中国')

    expect(screen.getByRole('button', { name: '高级筛选，已启用 1 项' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '重置高级筛选' }))

    expect(screen.getByLabelText('国家/地区')).toHaveValue('')
    expect(screen.getByRole('button', { name: '高级筛选' })).toBeInTheDocument()
  })
})
