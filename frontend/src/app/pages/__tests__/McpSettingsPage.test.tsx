import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('../../../api', () => ({
  createMcpCredential: vi.fn(),
  getMcpSettings: vi.fn(),
  updateMcpSettings: vi.fn(),
}))

vi.mock('../../../shared/errors', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}))

import { McpSettingsPage } from '../system/McpSettingsPage'

const api = await vi.importMock<Record<string, ReturnType<typeof vi.fn>>>('../../../api')

const disabledSettings = {
  enabled: false,
  server_name: 'Yuanjing Trade ERP',
  transport: 'streamable_http',
  endpoint_path: '/mcp',
  token_parameter: 'Authorization',
  token_prefix_required: true,
  credential_available: false,
  credential_issued_at: null,
  credential_expires_at: null,
  tool_count: 15,
  resources: [
    { key: 'products', label: '商品', tools: ['list_products', 'get_product'] },
    { key: 'customers', label: '客户', tools: ['list_customers', 'get_customer'] },
    { key: 'export_orders', label: '出口订单', tools: ['list_export_orders'] },
  ],
  updated_by: null,
  updated_at: null,
}

describe('McpSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.getMcpSettings.mockResolvedValue(disabledSettings)
    api.updateMcpSettings.mockResolvedValue({ ...disabledSettings, enabled: true })
    api.createMcpCredential.mockResolvedValue({
      access_token: 'mcp-dedicated-token',
      token_type: 'Bearer',
      expires_at: '2026-08-22T00:00:00Z',
    })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  it('hides connection details until MCP is enabled', async () => {
    render(<McpSettingsPage />)

    await waitFor(() => expect(api.getMcpSettings).toHaveBeenCalledTimes(1))
    expect(screen.getByText('MCP 服务未启用')).toBeTruthy()
    expect(screen.queryByText('连接与鉴权')).toBeNull()
  })

  it('shows a permission-oriented error instead of an endless skeleton when loading fails', async () => {
    api.getMcpSettings.mockRejectedValueOnce(new Error('Forbidden'))

    render(<McpSettingsPage />)

    expect(await screen.findByText('MCP 配置加载失败')).toBeTruthy()
    expect(screen.getByText('请确认当前账号具备系统管理员权限后重试。')).toBeTruthy()
  })

  it('generates a dedicated MCP credential before copying connection information', async () => {
    render(<McpSettingsPage />)
    await waitFor(() => expect(api.getMcpSettings).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByRole('switch', { name: '是否启用 MCP' }))

    await waitFor(() => expect(api.updateMcpSettings).toHaveBeenCalledWith({ enabled: true }))
    expect(await screen.findByText('连接与鉴权')).toBeTruthy()
    expect(screen.getByText('http://localhost:3000/mcp')).toBeTruthy()

    expect(screen.getByRole('button', { name: '复制全部连接信息' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: '生成连接令牌' }))
    fireEvent.click(await screen.findByRole('button', { name: '确认生成' }))

    await waitFor(() => expect(api.createMcpCredential).toHaveBeenCalledTimes(1))
    fireEvent.click(screen.getByRole('button', { name: '复制全部连接信息' }))
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1))
    const copied = vi.mocked(navigator.clipboard.writeText).mock.calls[0][0]
    expect(copied).toContain('mcp-dedicated-token')
    expect(copied).not.toContain('secret-token')
    expect(copied).toContain('/mcp')
    expect(copied).toContain('Authorization')
  })
})
