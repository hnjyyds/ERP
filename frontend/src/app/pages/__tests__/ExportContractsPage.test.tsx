import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ── Mock API module (must be inline, no external variables due to hoisting) ──
vi.mock('../../../api', () => ({
  addExportContractAdvancePayment: vi.fn(),
  approveExportContract: vi.fn(),
  createExportContract: vi.fn(),
  exportExportContract: vi.fn(),
  listExportContracts: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  registerExportContractSignature: vi.fn(),
  submitExportContract: vi.fn(),
  updateExportContract: vi.fn(),
  listCustomers: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  getExportQuotationHistory: vi.fn().mockResolvedValue({ items: [], total: 0 }),
}))

// ── Mock routes（通过 importOriginal 自动包含所有真实路由导出）───
vi.mock('../../routes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../routes')>()
  return { ...actual }
})

// ── Mock shared modules ──────────────────────────────────────────
vi.mock('../../../shared/ui', () => {
  const React = require('react')
  return {
    FormSelect: (props: Record<string, unknown>) =>
      React.createElement('select', { ...props, 'data-testid': 'form-select' }),
    Metric: ({ label, value }: { label: string; value: unknown }) =>
      React.createElement('span', { 'data-testid': 'metric' }, `${label}: ${value}`),
    PanelTitle: ({ title }: { icon: unknown; title: string }) =>
      React.createElement('h3', { 'data-testid': 'panel-title' }, title),
  }
})

vi.mock('../../../shared/errors', () => ({
  showError: vi.fn(),
  showWarningDialog: vi.fn(),
}))

vi.mock('../../../shared/print', () => ({
  downloadCsv: vi.fn(),
  openExportContractPrint: vi.fn(),
}))

vi.mock('../../../shared/formOptions', () => ({
  exportContractStatusOptions: [
    { value: 'draft', label: '草稿' },
    { value: 'submitted', label: '已提交' },
    { value: 'approved', label: '已审批' },
    { value: 'rejected', label: '已驳回' },
  ],
}))

// Import after all mocks
import { ExportContractsPage } from '../sales/ExportContractsPage'
// Re-import mocked modules to get typed references
const api = await vi.importMock<Record<string, ReturnType<typeof vi.fn>>>('../../../api')

describe('ExportContractsPage', () => {
  const onNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    api.listExportContracts.mockResolvedValue({ items: [], total: 0 })
    api.listCustomers.mockResolvedValue({ items: [], total: 0 })
  })

  it('renders without crashing (list view)', async () => {
    const { container } = render(
      <ExportContractsPage detailId={undefined} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
    await waitFor(() => {
      expect(api.listExportContracts).toHaveBeenCalled()
    })
  })

  it('renders summary strip', async () => {
    render(<ExportContractsPage detailId={undefined} onNavigate={onNavigate} />)
    await waitFor(() => {
      expect(api.listExportContracts).toHaveBeenCalled()
    })
    expect(document.querySelector('[aria-label="出口合同概览"]')).toBeTruthy()
  })

  it('clicking search button triggers API call', async () => {
    render(<ExportContractsPage detailId={undefined} onNavigate={onNavigate} />)
    await waitFor(() => {
      expect(api.listExportContracts).toHaveBeenCalled()
    })
    api.listExportContracts.mockClear()

    const buttons = screen.getAllByRole('button')
    const searchButton = buttons.find((btn) => btn.textContent?.includes('查询'))
    expect(searchButton).toBeTruthy()
    await userEvent.click(searchButton!)
    await waitFor(() => {
      expect(api.listExportContracts).toHaveBeenCalledTimes(1)
    })
  })
})
