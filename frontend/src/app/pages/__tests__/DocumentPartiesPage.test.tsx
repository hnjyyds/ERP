import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { listDocumentParties } from '@/api'
import { DocumentPartiesPage } from '@/app/pages/masterdata/DocumentPartiesPage'

vi.mock('@/shared/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/ui')>()
  return {
    ...actual,
    Metric: ({ label, value }: { label: string; value: number | string }) => (
      <span data-testid="metric">{`${label}: ${value}`}</span>
    ),
  }
})

vi.mock('@/api', () => ({
  listDocumentParties: vi.fn(async () => ({
    items: [],
    total: 120,
    summary: {
      total: 120,
      default_count: 7,
      consignee_count: 5,
      issuing_bank_count: 3,
    },
  })),
  createDocumentParty: vi.fn(),
  updateDocumentParty: vi.fn(),
  deactivateDocumentParty: vi.fn(),
}))

describe('DocumentPartiesPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, '', '/masterdata/document-parties')
  })

  it('renders without crashing', () => {
    const { container } = render(<DocumentPartiesPage detailId={null} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders document parties list panel', () => {
    render(<DocumentPartiesPage detailId={null} onNavigate={onNavigate} />)
    expect(screen.getByText('单证资料列表')).toBeTruthy()
  })

  it('按 URL 页码请求服务端分页，并用后端汇总渲染指标', async () => {
    window.history.replaceState({}, '', '/masterdata/document-parties?page=2')
    render(<DocumentPartiesPage detailId={null} onNavigate={onNavigate} />)

    await waitFor(() =>
      expect(listDocumentParties).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50, offset: 50 }),
      ),
    )
    const metrics = screen.getAllByTestId('metric').map((element) => element.textContent ?? '')
    expect(metrics.some((text) => text.endsWith(': 120'))).toBe(true)
    expect(metrics.some((text) => text.endsWith(': 7'))).toBe(true)
    expect(metrics.some((text) => text.endsWith(': 5'))).toBe(true)
    expect(metrics.some((text) => text.endsWith(': 3'))).toBe(true)
  })

  it('状态筛选进入服务端请求', async () => {
    window.history.replaceState({}, '', '/masterdata/document-parties?status=inactive')
    render(<DocumentPartiesPage detailId={null} onNavigate={onNavigate} />)

    await waitFor(() =>
      expect(listDocumentParties).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'inactive', limit: 50, offset: 0 }),
      ),
    )
  })
})
