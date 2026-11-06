import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// ── Mock API module (must be inline, no external variables due to hoisting) ──
vi.mock('../../../api', () => ({
  addExportContractAdvancePayment: vi.fn(),
  approveExportContract: vi.fn(),
  createExportContract: vi.fn(),
  exportExportContract: vi.fn(),
  listExportContracts: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  listAssignableUsers: vi.fn().mockResolvedValue({ users: [] }),
  registerExportContractSignature: vi.fn(),
  submitExportContract: vi.fn(),
  updateExportContract: vi.fn(),
  listCustomers: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  listProducts: vi.fn().mockResolvedValue({ items: [], total: 0 }),
  getExportQuotationHistory: vi.fn().mockResolvedValue({ items: [], total: 0 }),
}))

// ── Mock routes（通过 importOriginal 自动包含所有真实路由导出）───
vi.mock('../../routes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../routes')>()
  return { ...actual }
})

// ── Mock shared modules ──────────────────────────────────────────
vi.mock('../../../shared/ui', () => {
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
  const currentUser = { id: 'u-admin', username: 'admin', display_name: '管理员', department_name: '管理部', avatar_type: 'preset' as const, avatar_value: 'blue', roles: ['admin'], permissions: ['system:super_admin'] }

  beforeEach(() => {
    vi.clearAllMocks()
    api.listExportContracts.mockResolvedValue({ items: [], total: 0 })
    api.listCustomers.mockResolvedValue({ items: [], total: 0 })
    api.listProducts.mockResolvedValue({ items: [], total: 0 })
    api.listAssignableUsers.mockResolvedValue({ users: [] })
  })

  it('renders without crashing (list view)', async () => {
    const { container } = render(
      <ExportContractsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
    await waitFor(() => {
      expect(api.listExportContracts).toHaveBeenCalled()
    })
  })

  it('renders summary strip', async () => {
    render(<ExportContractsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => {
      expect(api.listExportContracts).toHaveBeenCalled()
    })
    expect(document.querySelector('[aria-label="出口合同概览"]')).toBeTruthy()
  })

  it('clicking search button triggers API call', async () => {
    render(<ExportContractsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
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

  it('shows customer details in options but keeps the selected value concise', async () => {
    api.listCustomers.mockResolvedValue({
      items: [
        {
          id: 'customer-full',
          code: 'FULL-C-20260804C',
          cn_name: '全链路测试客户',
          en_name: 'Full Workflow Test Customer',
          country: 'Germany',
          address: null,
          website: null,
          status: 'active',
          owner_user_id: 'u-admin',
          contacts: [],
          primary_contact: null,
          credit_profile: null,
        },
      ],
      total: 1,
    })

    render(<ExportContractsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)

    await screen.findByText('客户筛选')
    const customerSelect = screen
      .getByText('客户筛选')
      .closest('label')
      ?.querySelector<HTMLElement>('[role="combobox"]')
    expect(customerSelect).toBeTruthy()
    await userEvent.click(customerSelect!)
    expect(await screen.findByText('FULL-C-20260804C · Germany')).toBeTruthy()

    await userEvent.click(screen.getByText('全链路测试客户'))
    await waitFor(() => {
      const selectedValue = customerSelect!.closest('.ant-select')
      expect(selectedValue).toHaveTextContent('全链路测试客户')
      expect(selectedValue).not.toHaveTextContent('FULL-C-20260804C')
    })
  })

  it('supports searching and selecting a salesperson while keeping id and name synchronized', async () => {
    api.listAssignableUsers.mockResolvedValue({
      users: [
        {
          id: 'u-admin',
          username: 'admin',
          display_name: '管理员',
          department_name: '管理部',
          avatar_type: 'preset',
          avatar_value: 'blue',
        },
        {
          id: 'u-sales',
          username: 'sales',
          display_name: '销售专员',
          department_name: '销售部',
          avatar_type: 'preset',
          avatar_value: 'green',
        },
      ],
    })
    const user = userEvent.setup()

    render(<ExportContractsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    await screen.findByText('合同列表')
    await user.click(screen.getByRole('button', { name: '新增合同' }))

    const dialog = await screen.findByRole('dialog')
    const salespersonSelect = within(dialog).getByRole('combobox', { name: '业务员' })
    await waitFor(() => {
      expect(api.listAssignableUsers).toHaveBeenCalledWith('sales:contract:edit')
      expect(salespersonSelect.closest('.ant-select')).toHaveTextContent('管理员')
    })

    await user.click(salespersonSelect)
    await user.type(salespersonSelect, 'sales')
    const salespersonOption = await screen.findByText('销售专员')
    await user.click(salespersonOption)

    await waitFor(() => {
      expect(salespersonSelect.closest('.ant-select')).toHaveTextContent('销售专员')
      expect(salespersonSelect.closest('.ant-select')).not.toHaveTextContent('u-sales')
    })
  })

  it('does not expose a source quotation number field when creating a contract', async () => {
    const user = userEvent.setup()

    render(<ExportContractsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    await screen.findByText('合同列表')
    await user.click(screen.getByRole('button', { name: '新增合同' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).queryByText('来源报价号')).not.toBeInTheDocument()
    expect(within(dialog).getByText('合同备注')).toBeInTheDocument()
  })

  it('adds multiple products as separate editable contract lines', async () => {
    api.listProducts.mockResolvedValue({
      items: [
        {
          id: 'product-bag',
          code: 'BAG-001',
          cn_name: '环保购物袋',
          en_name: 'Eco Shopping Bag',
          specification: '40 × 50 cm',
          model: 'BAG-L',
          customs_code: '4202920000',
          tax_rate: '13.00',
          rebate_rate: '9.00',
          package_info: '100 pcs / carton',
          unit: 'pcs',
          image_url: null,
          status: 'active',
          accessories: [],
        },
        {
          id: 'product-bottle',
          code: 'BOT-002',
          cn_name: '不锈钢保温杯',
          en_name: 'Vacuum Bottle',
          specification: '500 ml',
          model: 'VB-500',
          customs_code: '9617009000',
          tax_rate: '13.00',
          rebate_rate: '9.00',
          package_info: '24 pcs / carton',
          unit: 'pcs',
          image_url: null,
          status: 'active',
          accessories: [],
        },
      ],
      total: 2,
    })
    const user = userEvent.setup()

    render(<ExportContractsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    await screen.findByText('合同列表')
    await user.click(screen.getByRole('button', { name: '新增合同' }))
    await user.click(await screen.findByRole('button', { name: '添加商品' }))

    await user.click(await screen.findByRole('checkbox', { name: /环保购物袋/ }))
    await user.click(screen.getByRole('checkbox', { name: /不锈钢保温杯/ }))
    await user.click(screen.getByRole('button', { name: '添加 2 项' }))

    expect(await screen.findByText('环保购物袋')).toBeTruthy()
    expect(screen.getByText('不锈钢保温杯')).toBeTruthy()
    await user.type(
      screen.getByRole('textbox', { name: '环保购物袋条形码' }),
      '000123456789012345678901234567890123456789',
    )
    await user.clear(screen.getByRole('spinbutton', { name: '环保购物袋数量' }))
    await user.type(screen.getByRole('spinbutton', { name: '环保购物袋数量' }), '12')
    await user.click(screen.getByRole('button', { name: '新增出口合同' }))

    await waitFor(() => {
      expect(api.createExportContract).toHaveBeenCalledWith(
        expect.objectContaining({
          lines: [
            expect.objectContaining({
              product_id: 'product-bag',
              barcode: '000123456789012345678901234567890123456789',
              quantity: '12',
            }),
            expect.objectContaining({ product_id: 'product-bottle', quantity: '1' }),
          ],
        }),
      )
    })
  })
})
