import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as api from '../../../api'
import { OrganizationUsersPage } from '../organization/OrganizationUsersPage'
import type { CurrentUser } from '../../../api'

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
