import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createDocumentParty,
  listAssignableUsers,
  listCustomers,
  listDocumentParties,
} from '@/api'
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
  listCustomers: vi.fn(async () => ({ items: [], total: 0 })),
  listAssignableUsers: vi.fn(async () => ({ users: [] })),
}))

const documentParty = {
  id: 'dp-1',
  code: 'DP-001',
  party_type: 'consignee',
  display_name: '宁波收货人',
  customer_id: null,
  customer_name: null,
  country: '中国',
  address: null,
  contact_person: null,
  email: null,
  phone: null,
  bank_name: null,
  swift_code: null,
  account_no: null,
  tax_id: null,
  remarks: null,
  is_default: false,
  status: 'active',
  owner_user_id: 'user-1',
}

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

  it('新建空表单提交后字段旁保留必填错误并聚焦编号', async () => {
    const user = userEvent.setup()
    render(<DocumentPartiesPage detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(listDocumentParties).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: '新增单证资料' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: '新增单证资料' }))

    expect(await within(dialog).findByText('请填写编号')).toBeInTheDocument()
    const codeInput = within(dialog).getByLabelText(/^编号/)
    expect(codeInput).toHaveAttribute('aria-invalid', 'true')
    expect(codeInput).toHaveFocus()

    await user.type(codeInput, 'DP-QA-01')
    expect(within(dialog).queryByText('请填写编号')).not.toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: '新增单证资料' }))
    expect(await within(dialog).findByText('请填写显示名称')).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/显示名称/)).toHaveFocus()
  })

  it('关联客户改为按编号/名称检索，选择与清空同步回填标识和名称', async () => {
    const user = userEvent.setup()
    vi.mocked(listCustomers).mockResolvedValue({
      items: [
        {
          id: 'customer-uuid-1',
          code: 'QA261112-C01',
          cn_name: '测试客户',
          en_name: null,
        },
      ],
      total: 1,
    } as never)
    const createSpy = vi
      .mocked(createDocumentParty)
      .mockResolvedValue({ id: 'dp-1' } as never)

    render(<DocumentPartiesPage detailId={null} onNavigate={onNavigate} />)
    await waitFor(() => expect(listDocumentParties).toHaveBeenCalled())
    await user.click(screen.getByRole('button', { name: '新增单证资料' }))
    const dialog = await screen.findByRole('dialog')

    expect(within(dialog).queryByLabelText('关联客户 ID')).not.toBeInTheDocument()
    expect(within(dialog).queryByLabelText('关联客户名称')).not.toBeInTheDocument()

    const customerSelect = within(dialog).getByRole('combobox', { name: '关联客户' })
    await user.click(customerSelect)
    await user.type(customerSelect, '测试客户')
    await waitFor(() => expect(listCustomers).toHaveBeenCalledWith({
      q: '测试客户',
      limit: 20,
    }))
    await user.click(await screen.findByText('测试客户'))

    await user.type(within(dialog).getByLabelText(/^编号/), 'DP-QA-02')
    await user.type(within(dialog).getByLabelText(/显示名称/), '测试收货人')
    await user.type(within(dialog).getByLabelText(/国家/), '中国')
    await user.click(within(dialog).getByRole('button', { name: '新增单证资料' }))

    await waitFor(() => expect(createSpy).toHaveBeenCalled())
    expect(createSpy.mock.calls[0][0]).toEqual(
      expect.objectContaining({ customer_id: 'customer-uuid-1', customer_name: '测试客户' }),
    )
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

  it('列表加载失败显示独立错误态并可重试', async () => {
    const user = userEvent.setup()
    vi.mocked(listDocumentParties)
      .mockReset()
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValue({
        items: [documentParty],
        total: 1,
        summary: {
          total: 1,
          default_count: 0,
          consignee_count: 1,
          issuing_bank_count: 0,
        },
      })

    render(<DocumentPartiesPage detailId={null} onNavigate={onNavigate} />)

    expect(await screen.findByText('加载失败')).toBeTruthy()
    expect(screen.queryByText('完成首次录入后，这里会显示对应记录')).toBeNull()

    await user.click(screen.getByRole('button', { name: /重\s*试/ }))
    expect(await screen.findByText('DP-001')).toBeTruthy()
  })

  it('详情负责人显示可读姓名而不是内部 ID', async () => {
    vi.mocked(listDocumentParties).mockResolvedValue({
      items: [{ ...documentParty, owner_user_id: 'user-1' }],
      total: 1,
    })
    vi.mocked(listAssignableUsers).mockResolvedValue({
      users: [
        {
          id: 'user-1',
          username: 'owner',
          display_name: '张三',
          department_name: '业务部',
          avatar_type: 'preset',
          avatar_value: 'blue',
        },
      ],
    } as never)

    render(<DocumentPartiesPage detailId="dp-1" onNavigate={onNavigate} />)

    expect(await screen.findByText('张三')).toBeTruthy()
    expect(screen.queryByText('user-1')).toBeNull()
  })

  it('详情负责人为空或目录中找不到时显示未指定，并保留原始 ID 作为追溯线索', async () => {
    vi.mocked(listDocumentParties).mockResolvedValue({
      items: [{ ...documentParty, owner_user_id: 'user-missing' }],
      total: 1,
    })
    vi.mocked(listAssignableUsers).mockResolvedValue({ users: [] })

    render(<DocumentPartiesPage detailId="dp-1" onNavigate={onNavigate} />)

    const owner = await screen.findByText('未指定')
    expect(owner).toHaveAttribute('title', 'user-missing')
    expect(screen.queryByText('user-missing')).toBeNull()
  })

  it('详情负责人为空时显示未指定且不带内部 ID 提示', async () => {
    vi.mocked(listDocumentParties).mockResolvedValue({
      items: [{ ...documentParty, owner_user_id: '' }],
      total: 1,
    })
    vi.mocked(listAssignableUsers).mockResolvedValue({ users: [] })

    render(<DocumentPartiesPage detailId="dp-1" onNavigate={onNavigate} />)

    const owner = await screen.findByText('未指定')
    expect(owner).not.toHaveAttribute('title')
  })
})
