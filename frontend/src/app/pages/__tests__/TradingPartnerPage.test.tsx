import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  TradingPartnerPage,
  type TradingPartnerPageProps,
} from '@/app/pages/masterdata/TradingPartnerPage'
import type { PartnerEntity } from '@/app/pages/masterdata/tradingPartnerModel'

vi.mock('@/shared/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/ui')>()
  return {
    ...actual,
    Metric: ({ label, value }: { label: string; value: number | string }) => (
      <span data-testid="metric">{`${label}: ${value}`}</span>
    ),
  }
})

const unusedMutation = vi.fn(async () => {
  throw new Error('not used in render test')
})

const partnerRow = {
  id: 'p-1',
  code: 'P-FWD-001',
  cn_name: '远航国际货代',
  en_name: 'Yuanhang Forwarding',
  partner_type: 'freight_forwarder',
  country: '中国',
  address: null,
  website: null,
  status: 'active',
  contacts: [],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
} as unknown as PartnerEntity

const listEntity = vi.fn(async () => ({
  items: [partnerRow],
  total: 120,
  summary: { active_count: 118, contact_count: 340, partner_type_count: 4 },
}))

const defaultProps: TradingPartnerPageProps = {
  className: 'partner-page',
  entityLabel: '往来伙伴',
  pageTitle: '往来伙伴资料',
  searchPlaceholder: '搜索往来伙伴',
  createPrefix: 'PARTNER',
  kind: 'partner',
  detailId: null,
  listPath: '/masterdata/partners',
  detailPath: (id) => `/masterdata/partners/${id}`,
  onNavigate: vi.fn(),
  listEntity,
  createEntity: unusedMutation,
  updateEntity: unusedMutation,
  deactivateEntity: unusedMutation,
  addContact: unusedMutation,
  updateContact: unusedMutation,
  deleteContact: unusedMutation,
  listTransactions: vi.fn(async () => ({ items: [], total: 0 })),
}

function metricTexts() {
  return screen.getAllByTestId('metric').map((element) => element.textContent)
}

describe('TradingPartnerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, '', '/masterdata/partners')
  })

  it('renders without crashing', () => {
    const { container } = render(
      <TradingPartnerPage {...defaultProps} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders trading partner list panel', () => {
    render(<TradingPartnerPage {...defaultProps} />)
    expect(screen.getByText('往来伙伴资料')).toBeTruthy()
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

  it('列表按服务端分页请求且在翻页后保持汇总指标不变', async () => {
    render(<TradingPartnerPage {...defaultProps} />)

    await waitFor(() =>
      expect(listEntity).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50, offset: 0 }),
      ),
    )
    expect(screen.getByText('往来伙伴: 120')).toBeInTheDocument()
    const before = metricTexts()
    expect(before).toHaveLength(4)
    // 这些数字只来自后端 summary，当前页仅 1 条数据。
    for (const value of [120, 118, 340, 4]) {
      expect(before.some((text) => text?.endsWith(`: ${value}`))).toBe(true)
    }

    await userEvent.click(screen.getByTitle('2'))

    await waitFor(() =>
      expect(listEntity).toHaveBeenLastCalledWith(
        expect.objectContaining({ limit: 50, offset: 50 }),
      ),
    )
    expect(metricTexts()).toEqual(before)
  })

  it('提交筛选时回到第一页并保留筛选条件', async () => {
    render(<TradingPartnerPage {...defaultProps} />)
    await waitFor(() => expect(listEntity).toHaveBeenCalled())

    await userEvent.type(screen.getByPlaceholderText('搜索往来伙伴'), '远航')
    await userEvent.click(screen.getByRole('button', { name: '查询往来伙伴' }))

    await waitFor(() =>
      expect(listEntity).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: '远航', limit: 50, offset: 0 }),
      ),
    )
    expect(window.location.search).toContain('q=%E8%BF%9C%E8%88%AA')
  })
})
