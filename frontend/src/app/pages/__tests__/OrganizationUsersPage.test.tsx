import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as api from '@/api'
import { OrganizationUsersPage } from '@/app/pages/organization/OrganizationUsersPage'
import type { CurrentUser } from '@/api'

const mockCurrentUser: CurrentUser = {
  id: 'test-user-id',
  username: 'testuser',
  display_name: 'Test User',
  department_name: 'Engineering',
  avatar_type: 'preset',
  avatar_value: 'TU',
  roles: [],
  permissions: ['system:super_admin'],
}

describe('OrganizationUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(api, 'getOrganizationOptions').mockResolvedValue({
      departments: [{ id: 'dept-1', name: '管理部' }],
      roles: [{ id: 'role-1', name: '管理员', code: 'admin', permissions: [] }],
      permissions: [],
    } as never)
    vi.spyOn(api, 'listOrganizationUsers').mockResolvedValue({ users: [] } as never)
    // 公司信息加载失败不阻塞主流程，这里直接拒绝以避免依赖完整公司信息结构。
    vi.spyOn(api, 'getCompanyInfo').mockRejectedValue(new Error('skip company info'))
  })

  it('非超级管理员只提示缺少权限且不请求组织数据', async () => {
    const viewer: CurrentUser = { ...mockCurrentUser, permissions: ['dashboard:view'] }
    render(<OrganizationUsersPage currentUser={viewer} />)

    expect(await screen.findByText('缺少组织管理权限')).toBeInTheDocument()
    expect(api.getOrganizationOptions).not.toHaveBeenCalled()
    expect(api.listOrganizationUsers).not.toHaveBeenCalled()
    expect(api.getCompanyInfo).not.toHaveBeenCalled()
  })

  it('超级管理员首屏加载组织选项与用户列表', async () => {
    vi.spyOn(api, 'listOrganizationUsers').mockResolvedValue({
      users: [
        {
          id: 'user-1',
          username: 'alice',
          display_name: '爱丽丝',
          department_id: 'dept-1',
          department_name: '管理部',
          roles: [],
          is_active: true,
          password_set: true,
          created_at: '2026-01-01T08:00:00Z',
        },
      ],
    } as never)

    render(<OrganizationUsersPage currentUser={mockCurrentUser} />)

    // 用户同时出现在列表行和右侧详情头部。
    expect((await screen.findAllByText('爱丽丝')).length).toBeGreaterThan(0)
    expect(api.getOrganizationOptions).toHaveBeenCalledTimes(1)
    expect(api.listOrganizationUsers).toHaveBeenCalledTimes(1)
    expect(api.getCompanyInfo).toHaveBeenCalledTimes(1)
  })

  it('创建用户成功后展示初始密码并重新加载列表', async () => {
    const user = userEvent.setup()
    const createSpy = vi.spyOn(api, 'createOrganizationUser').mockResolvedValue({
      user: { id: 'user-2', username: 'newbie', display_name: '新同事' },
      initial_password: 'Init#123456',
    } as never)

    render(<OrganizationUsersPage currentUser={mockCurrentUser} />)
    await user.click(await screen.findByRole('button', { name: '新增用户' }))
    await user.type(await screen.findByLabelText('用户名'), 'newbie')
    await user.type(screen.getByLabelText('姓名'), '新同事')
    await user.click(screen.getByRole('button', { name: '创建用户' }))

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'newbie',
          display_name: '新同事',
          department_id: 'dept-1',
          role_ids: ['role-1'],
          is_active: true,
        }),
      )
    })
    // 初始密码只展示一次，创建成功后必须出现在独立弹窗里。
    expect(await screen.findByText('Init#123456')).toBeInTheDocument()
    expect(api.listOrganizationUsers).toHaveBeenCalledTimes(2)
  })

  it('保存角色权限时提交勾选后的权限 id', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'getOrganizationOptions').mockResolvedValue({
      departments: [{ id: 'dept-1', name: '管理部' }],
      roles: [
        {
          id: 'role-1',
          name: '管理员',
          code: 'admin',
          permissions: [{ id: 'perm-1', code: 'sample:request:view', name: '查看打样', category: 'functional' }],
        },
      ],
      permissions: [
        { id: 'perm-1', code: 'sample:request:view', name: '查看打样', category: 'functional' },
        { id: 'perm-2', code: 'sample:request:edit', name: '编辑打样', category: 'functional' },
      ],
    } as never)
    vi.spyOn(api, 'listOrganizationUsers').mockResolvedValue({
      users: [
        {
          id: 'user-1',
          username: 'alice',
          display_name: '爱丽丝',
          department_id: 'dept-1',
          department_name: '管理部',
          roles: [{ id: 'role-1', name: '管理员', code: 'admin' }],
          is_active: true,
          password_set: true,
          created_at: '2026-01-01T08:00:00Z',
        },
      ],
    } as never)
    const updateSpy = vi.spyOn(api, 'updateOrganizationRolePermissions').mockResolvedValue({
      id: 'role-1',
      name: '管理员',
      code: 'admin',
      permissions: [],
    } as never)

    render(<OrganizationUsersPage currentUser={mockCurrentUser} />)
    await user.click(await screen.findByRole('button', { name: '编辑用户权限' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(await within(dialog).findByLabelText('编辑打样'))
    await user.click(within(dialog).getByRole('button', { name: '保存权限' }))

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith('role-1', { permission_ids: ['perm-1', 'perm-2'] })
    })
  })

  it('保存公司信息时提交当前表单字段', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'getCompanyInfo').mockResolvedValue({
      name: '旧公司',
      name_en: null,
      letterhead: null,
      address: null,
      address_en: null,
      phone: null,
      fax: null,
      email: null,
      website: null,
      tax_no: null,
      bank_name: null,
      bank_account: null,
      bank_swift: null,
      updated_at: '2026-01-01T08:00:00Z',
    } as never)
    const updateSpy = vi.spyOn(api, 'updateCompanyInfo').mockResolvedValue({
      name: '新公司',
      updated_at: '2026-02-01T08:00:00Z',
    } as never)

    render(<OrganizationUsersPage currentUser={mockCurrentUser} />)
    await user.click(await screen.findByRole('button', { name: '编辑公司信息' }))
    const nameInput = await screen.findByLabelText('公司名称')
    await user.clear(nameInput)
    await user.type(nameInput, '新公司')
    await user.click(screen.getByRole('button', { name: '保存公司信息' }))

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ name: '新公司' }))
    })
  })

  it('renders without crashing', () => {
    const { container } = render(
      <OrganizationUsersPage currentUser={mockCurrentUser} />,
    )
    expect(container).toBeTruthy()
  })

  it('renders search input', async () => {
    render(<OrganizationUsersPage currentUser={mockCurrentUser} />)
    expect(await screen.findByPlaceholderText('搜索用户、部门或角色')).toBeTruthy()
  })

  it('resets the create form each time the modal opens', async () => {
    const user = userEvent.setup()
    render(<OrganizationUsersPage currentUser={mockCurrentUser} />)

    await user.click(await screen.findByRole('button', { name: '新增用户' }))
    const dialog = await screen.findByRole('dialog')
    const usernameInput = await within(dialog).findByLabelText('用户名')
    await user.type(usernameInput, 'stale-user')
    await user.type(within(dialog).getByLabelText('姓名'), '残留用户')

    await user.click(within(dialog).getByRole('button', { name: /取\s*消/ }))
    // antd Modal 关闭动画在 jsdom 中不会结束，直接用 fireEvent 重新打开即可。
    fireEvent.click(screen.getByRole('button', { name: '新增用户' }))

    const reopenedInputs = await screen.findAllByLabelText('用户名')
    expect(reopenedInputs[reopenedInputs.length - 1]).toHaveValue('')
    const reopenedNames = screen.getAllByLabelText('姓名')
    expect(reopenedNames[reopenedNames.length - 1]).toHaveValue('')
  })

  it('keeps the create form and typed values when creating a user fails', async () => {
    const user = userEvent.setup()
    const createSpy = vi
      .spyOn(api, 'createOrganizationUser')
      .mockRejectedValue(new Error('network down'))
    render(<OrganizationUsersPage currentUser={mockCurrentUser} />)

    await user.click(await screen.findByRole('button', { name: '新增用户' }))
    await user.type(await screen.findByLabelText('用户名'), 'failed-user')
    await user.type(screen.getByLabelText('姓名'), '失败用户')
    await user.click(screen.getByRole('button', { name: '创建用户' }))

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1)
    })
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'failed-user',
        display_name: '失败用户',
        department_id: 'dept-1',
      }),
    )
    // 失败后弹窗与已填写内容都必须保留，方便用户重试。
    expect(screen.getByLabelText('用户名')).toHaveValue('failed-user')
    expect(screen.getByLabelText('姓名')).toHaveValue('失败用户')
    expect(screen.getByRole('button', { name: '创建用户' })).toBeInTheDocument()
  })
})
