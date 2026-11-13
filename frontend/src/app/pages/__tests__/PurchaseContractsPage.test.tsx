import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as api from '@/api'
import { PurchaseContractsPage } from '@/app/pages/purchase/PurchaseContractsPage'

function metricValue(label: string): string | null | undefined {
  const cell = Array.from(document.querySelectorAll('.metric-cell')).find(
    (node) => node.querySelector('.metric-label')?.textContent === label,
  )
  return cell?.querySelector('.metric-value')?.textContent
}

describe('PurchaseContractsPage', () => {
  const onNavigate = vi.fn()
  const currentUser = { id: 'u-admin', username: 'admin', display_name: '管理员', department_name: '管理部', avatar_type: 'preset' as const, avatar_value: 'blue', roles: ['admin'], permissions: ['system:super_admin'] }

  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, '', '/')
  })

  it('renders without crashing', () => {
    const { container } = render(<PurchaseContractsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    expect(container).toBeTruthy()
  })

  it('renders purchase contract summary', () => {
    render(<PurchaseContractsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />)
    expect(screen.getAllByText('采购合同').length).toBeGreaterThanOrEqual(1)
  })

  it('lets the designated reviewer approve or reject a submitted contract', async () => {
    const user = userEvent.setup()
    const contract: api.PurchaseContract = {
      id: 'pc-review',
      code: 'PC-REVIEW',
      contract_date: '2026-08-04',
      supplier_id: 'supplier-pack-a',
      supplier_name: '华东包装制品厂',
      buyer_user_id: 'u-001',
      buyer_user_name: '演示业务主管',
      qc_user_id: 'u-qc',
      qc_user_name: '演示 QC 专员',
      currency: 'USD',
      delivery_date: '2026-08-30',
      payment_terms: '30% 预付，70% 出货前',
      source_type: 'stock_purchase',
      remarks: null,
      approval_status: 'submitted',
      submitted_at: '2026-08-04',
      approved_at: null,
      rejected_at: null,
      rejection_reason: null,
      reviewer_id: 'u-admin',
      reviewer_name: '管理员',
      cancelled_at: null,
      cancelled_by_id: null,
      cancelled_by_name: null,
      cancel_reason: null,
      reissued_from_id: null,
      reissued_from_code: null,
      reissue_reason: null,
      owner_user_id: 'u-001',
      statistics: {
        total_quantity: '100',
        total_amount: '1200.00',
        received_quantity: '0',
        unreceived_quantity: '100',
        paid_amount: '0',
        unpaid_amount: '1200.00',
      },
      lines: [],
      source_links: [],
      reminders: [],
    }
    vi.spyOn(api, 'listPurchaseContracts').mockResolvedValue({
      items: [contract],
      total: 1,
      summary: {
        submitted_count: 1,
        approved_count: 0,
        total_amount: '1200.00',
        currency: 'USD',
      },
    })
    vi.spyOn(api, 'listPurchaseContractReminders').mockResolvedValue({ items: [], total: 0 })
    vi.spyOn(api, 'listProducts').mockResolvedValue({
      items: [],
      total: 0,
      summary: { with_image_count: 0, accessory_count: 0 },
    })
    vi.spyOn(api, 'listSuppliers').mockResolvedValue({
      items: [],
      total: 0,
      summary: { active_count: 0, contact_count: 0, credit_profile_count: 0 },
    })
    vi.spyOn(api, 'listAssignableUsers').mockResolvedValue({ users: [] })

    render(
      <PurchaseContractsPage
        currentUser={currentUser}
        detailId="pc-review"
        onNavigate={onNavigate}
      />,
    )

    await user.click(await screen.findByRole('button', { name: '审批采购合同' }))
    const dialog = await screen.findByRole('dialog', { name: '审批采购合同' })
    expect(within(dialog).getByRole('button', { name: '通过审批' })).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: '驳回合同' })).toBeInTheDocument()
    expect(within(dialog).getByLabelText('驳回原因')).toBeRequired()
  })

  function makeContract(overrides: Partial<api.PurchaseContract> = {}): api.PurchaseContract {
    return {
      id: 'pc-cancel',
      code: 'PC-CANCEL',
      contract_date: '2026-08-04',
      supplier_id: 'supplier-pack-a',
      supplier_name: '华东包装制品厂',
      buyer_user_id: 'u-001',
      buyer_user_name: '演示业务主管',
      qc_user_id: 'u-qc',
      qc_user_name: '演示 QC 专员',
      currency: 'USD',
      delivery_date: '2026-08-30',
      payment_terms: '30% 预付，70% 出货前',
      source_type: 'stock_purchase',
      remarks: null,
      approval_status: 'draft',
      submitted_at: null,
      approved_at: null,
      rejected_at: null,
      rejection_reason: null,
      reviewer_id: null,
      reviewer_name: null,
      cancelled_at: null,
      cancelled_by_id: null,
      cancelled_by_name: null,
      cancel_reason: null,
      reissued_from_id: null,
      reissued_from_code: null,
      reissue_reason: null,
      owner_user_id: 'u-001',
      statistics: {
        total_quantity: '100',
        total_amount: '1200.00',
        received_quantity: '0',
        unreceived_quantity: '100',
        paid_amount: '0',
        unpaid_amount: '1200.00',
      },
      lines: [],
      source_links: [],
      reminders: [],
      ...overrides,
    }
  }

  function mockContractApis(contract: api.PurchaseContract) {
    const listSpy = vi.spyOn(api, 'listPurchaseContracts').mockResolvedValue({
      items: [contract],
      total: 1,
      summary: {
        submitted_count: 1,
        approved_count: 0,
        total_amount: '1200.00',
        currency: 'USD',
      },
    })
    vi.spyOn(api, 'listPurchaseContractReminders').mockResolvedValue({ items: [], total: 0 })
    vi.spyOn(api, 'listProducts').mockResolvedValue({
      items: [],
      total: 0,
      summary: { with_image_count: 0, accessory_count: 0 },
    })
    vi.spyOn(api, 'listSuppliers').mockResolvedValue({
      items: [],
      total: 0,
      summary: { active_count: 0, contact_count: 0, credit_profile_count: 0 },
    })
    vi.spyOn(api, 'listAssignableUsers').mockResolvedValue({ users: [] })
    return listSpy
  }

  it('blocks cancelling a draft contract without a reason and never calls the API', async () => {
    const user = userEvent.setup()
    const contract = makeContract()
    mockContractApis(contract)
    const cancelSpy = vi
      .spyOn(api, 'cancelPurchaseContract')
      .mockResolvedValue({ ...contract, approval_status: 'cancelled' })

    render(
      <PurchaseContractsPage currentUser={currentUser} detailId={contract.id} onNavigate={onNavigate} />,
    )
    await user.click(await screen.findByRole('button', { name: '作废合同' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('作废采购合同')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: '确认作废' }))

    expect(await within(dialog).findByText('请填写作废原因')).toBeInTheDocument()
    expect(cancelSpy).not.toHaveBeenCalled()
  })

  it('keeps the cancel dialog and typed reason when the cancellation request fails', async () => {
    const user = userEvent.setup()
    const contract = makeContract()
    mockContractApis(contract)
    const cancelSpy = vi
      .spyOn(api, 'cancelPurchaseContract')
      .mockRejectedValue(new Error('network down'))

    render(
      <PurchaseContractsPage currentUser={currentUser} detailId={contract.id} onNavigate={onNavigate} />,
    )
    await user.click(await screen.findByRole('button', { name: '作废合同' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('作废采购合同')).toBeInTheDocument()
    await user.type(within(dialog).getByLabelText('作废原因'), '供应商停产')
    await user.click(within(dialog).getByRole('button', { name: '确认作废' }))

    await waitFor(() => {
      expect(cancelSpy).toHaveBeenCalledWith(contract.id, { reason: '供应商停产' })
    })
    expect(within(dialog).getByLabelText('作废原因')).toHaveValue('供应商停产')
    // 失败后弹窗必须保持打开，便于用户重试。
    expect(within(dialog).getByText('作废采购合同')).toBeInTheDocument()
  })

  it('blocks reissuing a cancelled contract without a reason and never calls the API', async () => {
    const user = userEvent.setup()
    const contract = makeContract({ approval_status: 'cancelled', cancelled_at: '2026-08-05', cancel_reason: '供应商停产' })
    mockContractApis(contract)
    const reissueSpy = vi
      .spyOn(api, 'reissuePurchaseContract')
      .mockResolvedValue({ ...contract, id: 'pc-reissued', code: 'PC-NEW' })

    render(
      <PurchaseContractsPage currentUser={currentUser} detailId={contract.id} onNavigate={onNavigate} />,
    )
    await user.click(await screen.findByRole('button', { name: '作废重开' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('重开采购合同')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: '重开为新合同' }))

    expect(await within(dialog).findByText('请填写重开原因')).toBeInTheDocument()
    expect(reissueSpy).not.toHaveBeenCalled()
  })

  it('按服务端分页请求且在翻页时保持后端汇总指标不变', async () => {
    window.history.replaceState({}, '', '/')
    const listSpy = vi.spyOn(api, 'listPurchaseContracts').mockResolvedValue({
      items: [makeContract()],
      total: 120,
      summary: {
        submitted_count: 3,
        approved_count: 2,
        total_amount: '300.00',
        currency: 'USD',
      },
    })
    vi.spyOn(api, 'listPurchaseContractReminders').mockResolvedValue({ items: [], total: 0 })
    vi.spyOn(api, 'listProducts').mockResolvedValue({
      items: [],
      total: 0,
      summary: { with_image_count: 0, accessory_count: 0 },
    })
    vi.spyOn(api, 'listSuppliers').mockResolvedValue({
      items: [],
      total: 0,
      summary: { active_count: 0, contact_count: 0, credit_profile_count: 0 },
    })
    vi.spyOn(api, 'listAssignableUsers').mockResolvedValue({ users: [] })

    render(
      <PurchaseContractsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
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

  it('提交筛选时写入 URL 并回到第 1 页请求', async () => {
    const user = userEvent.setup()
    window.history.replaceState({}, '', '/?page=3')
    const listSpy = mockContractApis(makeContract())

    render(
      <PurchaseContractsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )
    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(expect.objectContaining({ limit: 50, offset: 100 }))
    })

    await user.type(screen.getByLabelText('合同搜索'), '铝箔')
    await user.click(screen.getByRole('button', { name: '查询' }))

    await waitFor(() => {
      expect(listSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: '铝箔', limit: 50, offset: 0 }),
      )
    })
    const params = new URLSearchParams(window.location.search)
    expect(params.get('q')).toBe('铝箔')
    expect(params.get('page')).toBeNull()
  })

  it('供应商筛选提交 UUID 而不是编号文本', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'listPurchaseContracts').mockResolvedValue({
      items: [],
      total: 0,
      summary: { submitted_count: 0, approved_count: 0, total_amount: '0.00', currency: 'USD' },
    })
    vi.spyOn(api, 'listPurchaseContractReminders').mockResolvedValue({ items: [], total: 0 })
    vi.spyOn(api, 'listSuppliers').mockResolvedValue({
      items: [
        {
          id: 'supplier-uuid-1',
          code: 'QA261112-S01',
          cn_name: '华东包装制品厂',
          en_name: 'East Packing',
          country: '中国',
          address: null,
          website: null,
          status: 'active',
          owner_user_id: 'u-001',
          contacts: [],
          primary_contact: null,
          credit_profile: null,
        },
      ],
      total: 1,
      summary: { active_count: 1, contact_count: 0, credit_profile_count: 0 },
    })

    render(
      <PurchaseContractsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )

    await user.click(screen.getByRole('combobox', { name: '供应商标识' }))
    await user.click(await screen.findByText('华东包装制品厂'))
    await user.click(screen.getByRole('button', { name: '查询' }))

    await waitFor(() => {
      expect(api.listPurchaseContracts).toHaveBeenLastCalledWith(
        expect.objectContaining({ supplier_id: 'supplier-uuid-1' }),
      )
    })
  })

  it('刷新或直达时从 URL 恢复筛选并按该条件请求', async () => {
    window.history.replaceState(
      {},
      '',
      '/?q=PC-1&status=submitted&supplier=supplier-pack-a&source=stock_purchase&page=2',
    )
    const listSpy = mockContractApis(makeContract())

    render(
      <PurchaseContractsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )

    await waitFor(() => {
      expect(listSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          q: 'PC-1',
          approval_status: 'submitted',
          supplier_id: 'supplier-pack-a',
          source_type: 'stock_purchase',
          limit: 50,
          offset: 50,
        }),
      )
    })
    expect(screen.getByLabelText('合同搜索')).toHaveValue('PC-1')
    expect(screen.getByRole('combobox', { name: '供应商标识' })).toBeTruthy()
  })

  it('重新打开作废弹窗时清空上次填写的原因和错误', async () => {
    const user = userEvent.setup()
    const contract = makeContract()
    mockContractApis(contract)

    render(
      <PurchaseContractsPage currentUser={currentUser} detailId={contract.id} onNavigate={onNavigate} />,
    )
    await user.click(await screen.findByRole('button', { name: '作废合同' }))
    let dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: '确认作废' }))
    expect(await within(dialog).findByText('请填写作废原因')).toBeInTheDocument()
    await user.type(within(dialog).getByLabelText('作废原因'), '供应商停产')
    await user.click(within(dialog).getByRole('button', { name: /取\s*消/ }))

    await user.click(screen.getByRole('button', { name: '作废合同' }))
    dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText('作废原因')).toHaveValue('')
    expect(within(dialog).queryByText('请填写作废原因')).not.toBeInTheDocument()
  })

  it('新增采购合同缺少供应商时阻止提交并保留已填内容', async () => {
    const user = userEvent.setup()
    mockContractApis(makeContract())
    const createSpy = vi.spyOn(api, 'createPurchaseContract')

    render(
      <PurchaseContractsPage currentUser={currentUser} detailId={null} onNavigate={onNavigate} />,
    )
    await user.click(await screen.findByRole('button', { name: '新增采购合同' }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('供应商名称'), '测试工厂')
    await user.click(within(dialog).getByRole('button', { name: '新增采购合同' }))

    await waitFor(() => {
      expect(createSpy).not.toHaveBeenCalled()
    })
    expect(within(dialog).getByLabelText('供应商名称')).toHaveValue('测试工厂')
  })

  it('草稿状态下编辑和作废可用，未选审批人不能提交且审批按钮禁用', async () => {
    const contract = makeContract()
    mockContractApis(contract)

    render(
      <PurchaseContractsPage currentUser={currentUser} detailId={contract.id} onNavigate={onNavigate} />,
    )

    expect(await screen.findByRole('button', { name: '编辑合同' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '提交采购合同' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '审批采购合同' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '作废合同' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: '作废重开' })).not.toBeInTheDocument()
  })
})
