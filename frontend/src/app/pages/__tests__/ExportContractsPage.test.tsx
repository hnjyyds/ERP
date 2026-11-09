import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// ── Mock API module (must be inline, no external variables due to hoisting) ──
vi.mock('@/api', () => ({
  addExportContractAdvancePayment: vi.fn(),
  approveExportContract: vi.fn(),
  cancelExportContract: vi.fn(),
  createExportContract: vi.fn(),
  exportExportContract: vi.fn(),
  reissueExportContract: vi.fn(),
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
vi.mock('@/app/routes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/app/routes')>()
  return { ...actual }
})

// ── Mock shared modules ──────────────────────────────────────────
vi.mock('@/shared/ui', () => {
  return {
    FormModal: ({
      open,
      title,
      children,
      onSubmit,
      onCancel,
      submitLabel,
      submitting,
    }: {
      open: boolean
      title: React.ReactNode
      children: React.ReactNode
      onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
      onCancel?: () => void
      submitLabel?: React.ReactNode
      submitting?: boolean
    }) =>
      open
        ? React.createElement(
            'form',
            { 'data-testid': 'form-modal', onSubmit },
            React.createElement('h3', null, title),
            children,
            React.createElement('button', { type: 'button', onClick: onCancel }, '取消'),
            React.createElement('button', { type: 'submit', disabled: submitting }, submitLabel ?? '提交'),
          )
        : null,
    FormSelect: (props: Record<string, unknown>) =>
      React.createElement('select', { ...props, 'data-testid': 'form-select' }),
    Metric: ({ label, value }: { label: string; value: unknown }) =>
      React.createElement('span', { 'data-testid': 'metric' }, `${label}: ${value}`),
    ListPageShell: ({
      title,
      toolbar,
      children,
    }: {
      icon: React.ReactNode
      title: string
      toolbar?: React.ReactNode
      children: React.ReactNode
      className?: string
      style?: React.CSSProperties
    }) =>
      React.createElement(
        'section',
        null,
        React.createElement('h3', { 'data-testid': 'panel-title' }, title),
        toolbar,
        children,
      ),
    PanelTitle: ({ title }: { icon: unknown; title: string }) =>
      React.createElement('h3', { 'data-testid': 'panel-title' }, title),
  }
})

vi.mock('@/shared/errors', () => ({
  showError: vi.fn(),
  showWarningDialog: vi.fn(),
}))

vi.mock('@/shared/print', () => ({
  downloadCsv: vi.fn(),
  openExportContractPrint: vi.fn(),
}))

vi.mock('@/shared/formOptions', () => ({
  exportContractStatusOptions: [
    { value: 'draft', labelKey: 'sales.status.draft' },
    { value: 'submitted', labelKey: 'sales.status.submitted' },
    { value: 'approved', labelKey: 'sales.status.approved' },
    { value: 'rejected', labelKey: 'sales.status.rejected' },
  ],
}))

// Import after all mocks
import { ExportContractsPage } from '@/app/pages/sales/ExportContractsPage'
import type { ExportContract } from '@/api'
// Re-import mocked modules to get typed references
const api = await vi.importMock<Record<string, ReturnType<typeof vi.fn>>>('@/api')

const emptyContractSummary = {
  submitted_count: 0,
  approved_count: 0,
  total_amount: '0',
  advance_payment_amount: '0',
  currency: 'USD',
}

describe('ExportContractsPage', () => {
  const onNavigate = vi.fn()
  const currentUser = { id: 'u-admin', username: 'admin', display_name: '管理员', department_name: '管理部', avatar_type: 'preset' as const, avatar_value: 'blue', roles: ['admin'], permissions: ['system:super_admin'] }

  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, '', '/')
    api.listExportContracts.mockResolvedValue({
      items: [],
      total: 0,
      summary: emptyContractSummary,
    })
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

    // 两行各自拥有独立条形码输入框，直接等待输入框出现即可确认两行已渲染；
    // 不去断言商品名文本，避免与正在关闭的商品抽屉里的同名条目冲突。
    const bagBarcode = await screen.findByRole('textbox', { name: '环保购物袋条形码' })
    expect(screen.getByRole('textbox', { name: '不锈钢保温杯条形码' })).toBeTruthy()
    // 42 位条形码逐字符输入会产生 42 次受控重渲染，在并行跑全量时会把用例拖过 5s 超时；
    // 这里用一次 change 事件写入同样的最终值，断言的仍是完整 payload。
    fireEvent.change(bagBarcode, {
      target: { value: '000123456789012345678901234567890123456789' },
    })
    fireEvent.change(screen.getByRole('spinbutton', { name: '环保购物袋数量' }), {
      target: { value: '12' },
    })
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

  function makeExportContract(
    overrides: Partial<ExportContract> = {},
  ): ExportContract {
    return {
      id: 'ec-draft',
      code: 'EC-DRAFT',
      contract_date: '2026-08-04',
      customer_id: 'customer-1',
      customer_name: '全链路测试客户',
      sales_user_id: 'u-sales',
      sales_user_name: '销售专员',
      currency: 'USD',
      trade_term: 'FOB',
      planned_ship_date: '2026-09-01',
      payment_terms: '30% 预付，70% 出货前',
      source_quotation_id: null,
      source_quotation_no: null,
      remarks: null,
      approval_status: 'draft',
      submitted_at: null,
      approved_at: null,
      reviewer_id: null,
      reviewer_name: null,
      signature_status: 'none',
      customer_signed_at: null,
      cancelled_at: null,
      cancelled_by_id: null,
      cancelled_by_name: null,
      cancel_reason: null,
      reissued_from_id: null,
      reissued_from_code: null,
      reissue_reason: null,
      owner_user_id: 'u-admin',
      statistics: {
        total_quantity: '0',
        total_amount: '0',
        shipped_quantity: '0',
        shipped_amount: '0',
        unshipped_quantity: '0',
        unshipped_amount: '0',
        purchased_quantity: '0',
        unpurchased_quantity: '0',
        advance_payment_amount: '0',
      },
      lines: [],
      signatures: [],
      advance_payments: [],
      purchase_statuses: [],
      shipment_statuses: [],
      ...overrides,
    }
  }

  async function openCancelDialog(contract: ExportContract) {
    api.listExportContracts.mockResolvedValue({
      items: [contract],
      total: 1,
      summary: emptyContractSummary,
    })
    const user = userEvent.setup()
    render(<ExportContractsPage currentUser={currentUser} detailId={contract.id} onNavigate={onNavigate} />)
    await user.click(await screen.findByRole('button', { name: '作废合同' }))
    const dialog = await screen.findByTestId('form-modal')
    return { user, dialog }
  }

  it('blocks cancelling a draft contract without a reason and never calls the API', async () => {
    const contract = makeExportContract()
    const { user, dialog } = await openCancelDialog(contract)

    await user.click(within(dialog).getByRole('button', { name: '确认作废' }))

    expect(await within(dialog).findByText('请填写作废原因')).toBeInTheDocument()
    expect(api.cancelExportContract).not.toHaveBeenCalled()
  })

  it('keeps the cancel dialog and typed reason when the cancellation request fails', async () => {
    const contract = makeExportContract()
    api.cancelExportContract.mockRejectedValue(new Error('network down'))
    const { user, dialog } = await openCancelDialog(contract)

    await user.type(within(dialog).getByLabelText('作废原因'), '客户取消订单')
    await user.click(within(dialog).getByRole('button', { name: '确认作废' }))

    await waitFor(() => {
      expect(api.cancelExportContract).toHaveBeenCalledWith(contract.id, { reason: '客户取消订单' })
    })
    expect(within(dialog).getByLabelText('作废原因')).toHaveValue('客户取消订单')
    expect(within(dialog).getByRole('button', { name: '确认作废' })).toBeInTheDocument()
  })

  it('clears a previously typed cancel reason when the dialog is reopened', async () => {
    const contract = makeExportContract()
    const { user, dialog } = await openCancelDialog(contract)

    await user.type(within(dialog).getByLabelText('作废原因'), '临时原因')
    await user.click(within(dialog).getByRole('button', { name: '取消' }))
    await waitFor(() => {
      expect(screen.queryByTestId('form-modal')).not.toBeInTheDocument()
    })

    await user.click(await screen.findByRole('button', { name: '作废合同' }))
    const reopened = await screen.findByTestId('form-modal')
    expect(within(reopened).getByLabelText('作废原因')).toHaveValue('')
  })

  it('blocks reissuing a cancelled contract without a reason and never calls the API', async () => {
    const contract = makeExportContract({
      approval_status: 'cancelled',
      cancelled_at: '2026-08-05',
      cancel_reason: '客户取消订单',
    })
    api.listExportContracts.mockResolvedValue({
      items: [contract],
      total: 1,
      summary: emptyContractSummary,
    })
    const user = userEvent.setup()
    render(<ExportContractsPage currentUser={currentUser} detailId={contract.id} onNavigate={onNavigate} />)

    await user.click(await screen.findByRole('button', { name: '作废重开' }))
    const dialog = await screen.findByTestId('form-modal')
    await user.click(within(dialog).getByRole('button', { name: '重开为新合同' }))

    expect(await within(dialog).findByText('请填写重开原因')).toBeInTheDocument()
    expect(api.reissueExportContract).not.toHaveBeenCalled()
  })

  it('按服务端分页请求且在翻页时保持后端汇总指标不变', async () => {
    window.history.replaceState({}, '', '/')
    api.listExportContracts.mockResolvedValue({
      items: [makeExportContract()],
      total: 120,
      summary: {
        submitted_count: 3,
        approved_count: 2,
        total_amount: '300.00',
        advance_payment_amount: '100.00',
        currency: 'USD',
      },
    })

    render(
      <ExportContractsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )

    await waitFor(() => {
      expect(api.listExportContracts).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50, offset: 0 }),
      )
    })
    expect(screen.getByText('待审批: 3')).toBeInTheDocument()
    expect(screen.getByText('已审批: 2')).toBeInTheDocument()

    await userEvent.click(screen.getByTitle('2'))

    await waitFor(() => {
      expect(api.listExportContracts).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50, offset: 50 }),
      )
    })
    expect(screen.getByText('待审批: 3')).toBeInTheDocument()
    expect(screen.getByText('已审批: 2')).toBeInTheDocument()
  })

  it('提交筛选时写入 URL 并回到第 1 页请求', async () => {
    const user = userEvent.setup()
    window.history.replaceState({}, '', '/?page=3')
    api.listExportContracts.mockResolvedValue({
      items: [makeExportContract()],
      total: 120,
      summary: emptyContractSummary,
    })

    render(
      <ExportContractsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )
    await waitFor(() => {
      expect(api.listExportContracts).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 50, offset: 100 }),
      )
    })

    await user.type(screen.getByLabelText('合同搜索'), 'EC-1')
    await user.click(screen.getByRole('button', { name: '查询' }))

    await waitFor(() => {
      expect(api.listExportContracts).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: 'EC-1', limit: 50, offset: 0 }),
      )
    })
    const params = new URLSearchParams(window.location.search)
    expect(params.get('q')).toBe('EC-1')
    expect(params.get('page')).toBeNull()
  })

  it('刷新或直达时从 URL 恢复筛选并按该条件请求', async () => {
    window.history.replaceState(
      {},
      '',
      '/?q=EC-9&status=submitted&customer=customer-9&page=2',
    )
    api.listExportContracts.mockResolvedValue({
      items: [makeExportContract()],
      total: 120,
      summary: emptyContractSummary,
    })

    render(
      <ExportContractsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )

    await waitFor(() => {
      expect(api.listExportContracts).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'EC-9',
          approval_status: 'submitted',
          customer_id: 'customer-9',
          limit: 50,
          offset: 50,
        }),
      )
    })
    expect(screen.getByLabelText('合同搜索')).toHaveValue('EC-9')
  })

  it('新增出口合同提交失败后保留弹窗和已添加的商品行', async () => {
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
      ],
      total: 1,
    })
    api.createExportContract.mockRejectedValue(new Error('network down'))
    const user = userEvent.setup()

    render(
      <ExportContractsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )
    await user.click(await screen.findByRole('button', { name: '新增合同' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: '添加商品' }))
    await user.click(await screen.findByRole('checkbox', { name: /环保购物袋/ }))
    await user.click(screen.getByRole('button', { name: '添加 1 项' }))
    await user.click(within(dialog).getByRole('button', { name: '新增出口合同' }))

    await waitFor(() => {
      expect(api.createExportContract).toHaveBeenCalledTimes(1)
    })
    expect(within(dialog).getByText('环保购物袋')).toBeInTheDocument()
    expect(
      within(dialog).getByRole('button', { name: /新增出口合同/ }),
    ).toBeInTheDocument()
  })

  it('草稿状态下载入编辑和作废可用，未选审批人不能提交，审批按钮禁用', async () => {
    const contract = makeExportContract()
    api.listExportContracts.mockResolvedValue({
      items: [contract],
      total: 1,
      summary: emptyContractSummary,
    })

    render(
      <ExportContractsPage currentUser={currentUser} detailId={contract.id} onNavigate={onNavigate} />,
    )

    expect(await screen.findByRole('button', { name: '载入编辑' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '提交审批' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '审批通过' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '作废合同' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: '作废重开' })).not.toBeInTheDocument()
  })

  it('已提交但非指定审批人时审批按钮禁用并提示等待审批', async () => {
    const otherUser = { ...currentUser, permissions: ['sales:contract:approve'] }
    const contract = makeExportContract({
      approval_status: 'submitted',
      reviewer_id: 'u-reviewer',
      reviewer_name: '审批人',
    })
    api.listExportContracts.mockResolvedValue({
      items: [contract],
      total: 1,
      summary: emptyContractSummary,
    })

    render(
      <ExportContractsPage currentUser={otherUser} detailId={contract.id} onNavigate={onNavigate} />,
    )

    expect(await screen.findByRole('button', { name: '审批通过' })).toBeDisabled()
    expect(screen.getByText('等待 审批人 审批')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '载入编辑' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '提交审批' })).toBeDisabled()
  })
})
