import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as api from '@/api'
import type { ExportQuotation } from '@/api'
import { ExportQuotationsPage } from '@/app/pages/sales/ExportQuotationsPage'

const quotation = {
  id: 'q-1',
  code: 'Q-001',
  approval_status: 'submitted',
  customer_name: '客户A',
  trade_term: 'FOB',
  total_amount: '100.00',
  currency: 'USD',
  generated_contract_no: null,
} as unknown as ExportQuotation

function metricValue(label: string): string | null | undefined {
  const cell = Array.from(document.querySelectorAll('.metric-cell')).find(
    (node) => node.querySelector('.metric-label')?.textContent === label,
  )
  return cell?.querySelector('.metric-value')?.textContent
}

describe('ExportQuotationsPage', () => {
  const onNavigate = vi.fn()
  const currentUser = {
    id: 'u-admin',
    username: 'admin',
    display_name: '管理员',
    department_name: '管理部',
    avatar_type: 'preset' as const,
    avatar_value: 'blue',
    roles: ['admin'],
    permissions: ['system:super_admin'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = render(
      <ExportQuotationsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders quotation list panel', () => {
    render(
      <ExportQuotationsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )
    expect(screen.getByText('报价单列表')).toBeTruthy()
  })

  it('opens the quotation form from the list toolbar', () => {
    render(
      <ExportQuotationsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )

    fireEvent.click(screen.getByRole('button', { name: '新增出口报价' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('新增或编辑出口报价', { exact: true })).toBeInTheDocument()
  })

  it('按服务端分页请求且在翻页时保持后端汇总指标不变', async () => {
    window.history.replaceState({}, '', '/')
    const listSpy = vi.spyOn(api, 'listExportQuotations').mockResolvedValue({
      items: [quotation],
      total: 120,
      summary: { submitted_count: 3, approved_count: 2, total_amount: '300.00', currency: 'USD' },
    })
    vi.spyOn(api, 'listCustomers').mockResolvedValue({
      items: [],
      total: 0,
      summary: { active_count: 0, contact_count: 0, credit_profile_count: 0 },
    })

    render(
      <ExportQuotationsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ limit: 50, offset: 0 }))
    })
    expect(metricValue('待审批')).toBe('3')
    expect(metricValue('已审批')).toBe('2')

    await userEvent.click(screen.getByTitle('2'))

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ limit: 50, offset: 50 }))
    })
    expect(metricValue('待审批')).toBe('3')
    expect(metricValue('已审批')).toBe('2')
  })

  const emptyCustomers = {
    items: [],
    total: 0,
    summary: { active_count: 0, contact_count: 0, credit_profile_count: 0 },
  }

  function fieldByLabel(labelText: string): HTMLInputElement {
    const label = screen.getByText(labelText, { exact: true }).closest('label')
    const input = label?.querySelector('input, textarea')
    if (!input) throw new Error(`field not found: ${labelText}`)
    return input as HTMLInputElement
  }

  const quotationWith = (overrides: Partial<ExportQuotation> = {}): ExportQuotation =>
    ({
      id: 'q-1',
      code: 'Q-001',
      approval_status: 'draft',
      customer_id: 'c-1',
      customer_name: '客户A',
      trade_term: 'FOB',
      quote_date: '2026-10-01',
      approved_at: '2026-10-05',
      valid_until: '2026-12-31',
      sales_user_id: null,
      sales_user_name: null,
      reviewer_id: null,
      reviewer_name: null,
      generated_contract_no: null,
      description: '',
      total_amount: '100.00',
      currency: 'USD',
      lines: [
        {
          id: 'line-1',
          product_id: 'p-1',
          product_code: 'P-001',
          product_name: '产品A',
          specification: null,
          model: null,
          quantity: '10',
          unit: 'pcs',
          unit_price: '10.00',
          amount: '100.00',
          freight_method: 'sea',
          freight_amount: '0.00',
          remark: null,
          purchase_reference_supplier_name: null,
          purchase_reference_price: null,
        },
      ],
      ...overrides,
    }) as unknown as ExportQuotation

  const mockQuotationList = (item: ExportQuotation, total = 1) => {
    vi.spyOn(api, 'listExportQuotations').mockResolvedValue({
      items: [item],
      total,
      summary: { submitted_count: 1, approved_count: 0, total_amount: '100.00', currency: 'USD' },
    })
  }

  const mockDetailReferences = () => {
    vi.spyOn(api, 'getExportQuotationHistory').mockResolvedValue({
      items: [],
      total: 0,
      summary: { submitted_count: 0, approved_count: 0, total_amount: '0', currency: null },
    })
    vi.spyOn(api, 'getExportQuotationPurchaseReferences').mockResolvedValue({
      items: [],
      total: 0,
    })
    vi.spyOn(api, 'getExportQuotationSampleDeliveries').mockResolvedValue({
      items: [],
      total: 0,
    })
    vi.spyOn(api, 'getQuotationSampleRequests').mockResolvedValue({
      items: [],
      total: 0,
    })
    vi.spyOn(api, 'listCustomers').mockResolvedValue(emptyCustomers)
    vi.spyOn(api, 'listAssignableUsers').mockResolvedValue({ users: [] })
  }

  it('从 URL 恢复筛选与页码，并在浏览器前进后退时重新读取', async () => {
    window.history.replaceState({}, '', '/sales/quotations?q=Q&status=approved&customer=c-1&page=2')
    mockDetailReferences()
    const listSpy = vi.spyOn(api, 'listExportQuotations').mockResolvedValue({
      items: [quotationWith({ approval_status: 'approved' })],
      total: 120,
      summary: { submitted_count: 0, approved_count: 1, total_amount: '100.00', currency: 'USD' },
    })

    render(
      <ExportQuotationsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'Q',
          approval_status: 'approved',
          customer_id: 'c-1',
          limit: 50,
          offset: 50,
        }),
      )
    })
    expect(screen.getByPlaceholderText('单号 / 客户 / 产品 / 条款')).toHaveValue('Q')
    expect(fieldByLabel('审批状态').closest('.ant-select')?.textContent).toContain('已审批')

    window.history.pushState({}, '', '/sales/quotations?q=Q2&status=draft&customer=c-2&page=1')
    window.dispatchEvent(new PopStateEvent('popstate'))

    await waitFor(() => {
      expect(listSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          q: 'Q2',
          approval_status: 'draft',
          customer_id: 'c-2',
          offset: 0,
        }),
      )
    })
    expect(screen.getByPlaceholderText('单号 / 客户 / 产品 / 条款')).toHaveValue('Q2')
    expect(fieldByLabel('审批状态').closest('.ant-select')?.textContent).toContain('草稿')
  })

  it('提交筛选时写入 URL 并回到第一页', async () => {
    window.history.replaceState({}, '', '/sales/quotations?page=3')
    mockDetailReferences()
    const listSpy = vi.spyOn(api, 'listExportQuotations').mockResolvedValue({
      items: [quotation],
      total: 120,
      summary: { submitted_count: 0, approved_count: 0, total_amount: '0', currency: 'USD' },
    })
    const user = userEvent.setup()
    render(
      <ExportQuotationsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ offset: 100 }))
    })

    await user.type(screen.getByPlaceholderText('单号 / 客户 / 产品 / 条款'), 'Q-2')
    await user.click(fieldByLabel('审批状态'))
    const approvedOptions = await screen.findAllByText('已审批')
    await user.click(
      approvedOptions.find((element) =>
        element.classList.contains('ant-select-item-option-content'),
      )!,
    )
    await user.click(screen.getByRole('button', { name: '查询' }))

    await waitFor(() => {
      expect(listSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: 'Q-2', approval_status: 'approved', offset: 0 }),
      )
    })
    const query = new URLSearchParams(window.location.search)
    expect(query.get('q')).toBe('Q-2')
    expect(query.get('status')).toBe('approved')
    expect(query.get('page')).toBeNull()
    expect(screen.getByTitle('1')).toHaveClass('ant-pagination-item-active')
  })

  it('审批按钮按指定审批人启用，非指定人时禁用并提示等待', async () => {
    window.history.replaceState({}, '', '/')
    mockDetailReferences()
    const reviewerQuotation = quotationWith({
      approval_status: 'submitted',
      reviewer_id: 'u-manager',
      reviewer_name: '业务主管',
    })
    mockQuotationList(reviewerQuotation)
    const viewer = { ...currentUser, id: 'u-sales', roles: ['sales'], permissions: [] }
    const first = render(
      <ExportQuotationsPage currentUser={viewer} detailId="q-1" onNavigate={onNavigate} />,
    )

    await waitFor(() => expect(screen.getByRole('button', { name: '审批通过' })).toBeDisabled())
    expect(screen.getByText('等待 业务主管 审批')).toBeTruthy()
    first.unmount()

    const assignedQuotation = quotationWith({
      approval_status: 'submitted',
      reviewer_id: 'u-sales',
      reviewer_name: '销售员',
    })
    mockQuotationList(assignedQuotation)
    const approveSpy = vi
      .spyOn(api, 'approveExportQuotation')
      .mockResolvedValue(quotationWith({ approval_status: 'approved' }))
    render(
      <ExportQuotationsPage currentUser={viewer} detailId="q-1" onNavigate={onNavigate} />,
    )

    const approveButton = await screen.findByRole('button', { name: '审批通过' })
    expect(approveButton).toBeEnabled()
    await userEvent.setup().click(approveButton)

    await waitFor(() => {
      expect(approveSpy).toHaveBeenCalledWith('q-1', {
        reviewer_name: '',
        approved_at: '2026-10-01',
      })
    })
  })

  it('新增报价失败时保留弹窗和已填写的产品信息', async () => {
    window.history.replaceState({}, '', '/')
    mockDetailReferences()
    vi.spyOn(api, 'listExportQuotations').mockResolvedValue({
      items: [],
      total: 0,
      summary: { submitted_count: 0, approved_count: 0, total_amount: '0', currency: 'USD' },
    })
    const createSpy = vi
      .spyOn(api, 'createExportQuotation')
      .mockRejectedValueOnce(new Error('boom'))
    const user = userEvent.setup()
    render(
      <ExportQuotationsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )

    await user.click(screen.getByRole('button', { name: '新增出口报价' }))
    const dialog = within(screen.getByRole('dialog'))
    await user.type(fieldByLabel('商品名称'), '测试产品')
    await user.clear(fieldByLabel('销售单价'))
    await user.type(fieldByLabel('销售单价'), '12.5')
    await user.click(dialog.getByRole('button', { name: '新增出口报价' }))

    await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1))
    expect(createSpy.mock.calls[0][0].lines[0]).toMatchObject({
      product_name: '测试产品',
      unit_price: '12.5',
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(fieldByLabel('商品名称')).toHaveValue('测试产品')
    expect(fieldByLabel('销售单价')).toHaveValue(12.5)
  })

  it('撤回与驳回入口仅在已提交报价显示', async () => {
    window.history.replaceState({}, '', '/')
    mockDetailReferences()
    const manager = {
      ...currentUser,
      id: 'u-manager',
      roles: ['manager'],
      permissions: ['sales:quotation:approve'],
    }
    mockQuotationList(
      quotationWith({
        approval_status: 'submitted',
        reviewer_id: 'u-manager',
        reviewer_name: '业务主管',
        owner_user_id: 'u-manager',
      }),
    )
    const first = render(
      <ExportQuotationsPage currentUser={manager} detailId="q-1" onNavigate={onNavigate} />,
    )

    expect(await screen.findByRole('button', { name: /撤\s*回/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /驳\s*回/ })).toBeEnabled()
    first.unmount()

    mockQuotationList(quotationWith({ approval_status: 'draft' }))
    render(<ExportQuotationsPage currentUser={manager} detailId="q-1" onNavigate={onNavigate} />)

    await screen.findByRole('button', { name: '生成出口合同' })
    expect(screen.queryByRole('button', { name: /撤\s*回/ })).toBeNull()
    expect(screen.queryByRole('button', { name: /驳\s*回/ })).toBeNull()
  })

  it('驳回原因必填，填写后提交驳回请求', async () => {
    window.history.replaceState({}, '', '/')
    mockDetailReferences()
    const manager = {
      ...currentUser,
      id: 'u-manager',
      roles: ['manager'],
      permissions: ['sales:quotation:approve'],
    }
    mockQuotationList(
      quotationWith({
        approval_status: 'submitted',
        reviewer_id: 'u-manager',
        reviewer_name: '业务主管',
        owner_user_id: 'u-manager',
      }),
    )
    const rejectSpy = vi
      .spyOn(api, 'rejectExportQuotation')
      .mockResolvedValue(quotationWith({ approval_status: 'rejected' }))
    const user = userEvent.setup()
    render(<ExportQuotationsPage currentUser={manager} detailId="q-1" onNavigate={onNavigate} />)

    await user.click(await screen.findByRole('button', { name: /驳\s*回/ }))
    const dialog = within(await screen.findByRole('dialog'))
    const confirm = dialog.getByRole('button', { name: '确认驳回' })
    expect(confirm).toBeDisabled()

    await user.type(dialog.getByLabelText(/驳回原因/), '价格偏高')
    await user.click(confirm)

    await waitFor(() => {
      expect(rejectSpy).toHaveBeenCalledWith('q-1', {
        rejected_at: '2026-10-01',
        rejection_reason: '价格偏高',
      })
    })
  })

  it('撤回提交后调用撤回接口', async () => {
    window.history.replaceState({}, '', '/')
    mockDetailReferences()
    const manager = {
      ...currentUser,
      id: 'u-manager',
      roles: ['manager'],
      permissions: ['sales:quotation:approve'],
    }
    mockQuotationList(
      quotationWith({
        approval_status: 'submitted',
        reviewer_id: 'u-manager',
        reviewer_name: '业务主管',
        owner_user_id: 'u-manager',
      }),
    )
    const withdrawSpy = vi
      .spyOn(api, 'withdrawExportQuotation')
      .mockResolvedValue(quotationWith({ approval_status: 'draft' }))
    const user = userEvent.setup()
    render(<ExportQuotationsPage currentUser={manager} detailId="q-1" onNavigate={onNavigate} />)

    await user.click(await screen.findByRole('button', { name: /撤\s*回/ }))

    await waitFor(() => {
      expect(withdrawSpy).toHaveBeenCalledWith('q-1')
    })
  })

  it('生成出口合同仅在已审批报价上可用，成功后展示合同号', async () => {
    window.history.replaceState({}, '', '/')
    mockDetailReferences()
    mockQuotationList(quotationWith({ approval_status: 'draft' }))
    const first = render(
      <ExportQuotationsPage currentUser={currentUser} detailId="q-1" onNavigate={onNavigate} />,
    )
    expect(await screen.findByRole('button', { name: '生成出口合同' })).toBeDisabled()
    first.unmount()

    const approved = quotationWith({
      approval_status: 'approved',
      reviewer_id: 'u-manager',
      reviewer_name: '业务主管',
    })
    mockQuotationList(approved)
    const contractSpy = vi.spyOn(api, 'confirmExportQuotationContract').mockResolvedValue({
      contract_no: 'EC-001',
      total_amount: '100.00',
      currency: 'USD',
    } as unknown as api.ExportQuotationContract)
    const user = userEvent.setup()
    render(
      <ExportQuotationsPage currentUser={currentUser} detailId="q-1" onNavigate={onNavigate} />,
    )

    const contractButton = await screen.findByRole('button', { name: '生成出口合同' })
    expect(contractButton).toBeEnabled()
    await user.click(contractButton)

    await waitFor(() => {
      expect(contractSpy).toHaveBeenCalledWith('q-1', { confirmed_at: '2026-10-05' })
    })
  })

  it('报价详情展示关联打样单', async () => {
    window.history.replaceState({}, '', '/')
    mockDetailReferences()
    mockQuotationList(quotationWith())
    const sampleRequestsSpy = vi.spyOn(api, 'getQuotationSampleRequests').mockResolvedValue({
      items: [
        {
          id: 'sr-1',
          code: 'SR-001',
          request_date: '2026-10-02',
          status: 'in_progress',
          requirements: '按图打样',
          due_date: null,
          destination: 'in_house',
          latest_progress: null,
          sample_record_id: null,
          sample_record_code: null,
        },
      ],
      total: 1,
    })

    render(
      <ExportQuotationsPage currentUser={currentUser} detailId="q-1" onNavigate={onNavigate} />,
    )

    await waitFor(() => expect(sampleRequestsSpy).toHaveBeenCalledWith('q-1'))
    expect(await screen.findByText('SR-001')).toBeTruthy()
    expect(screen.getByText('打样单')).toBeTruthy()
    expect(screen.getByText('未转样品登记')).toBeTruthy()
    expect(screen.getByRole('button', { name: '从该报价发起打样' })).toBeTruthy()
  })
})
