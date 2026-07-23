import { Alert, Button, Modal, Skeleton, Switch, Tag, Tooltip } from 'antd'
import {
  Bot,
  Check,
  ClipboardCopy,
  Copy,
  KeyRound,
  Network,
  PackageCheck,
  Power,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import {
  createMcpCredential,
  getMcpSettings,
  updateMcpSettings,
  type McpCredential,
  type McpSettings,
} from '../../../api'
import { showError, showSuccess } from '../../../shared/errors'

type ConnectionItemProps = {
  label: string
  value: string
  copyLabel?: string
  copyDisabled?: boolean
  sensitive?: boolean
}

function ConnectionItem({
  label,
  value,
  copyLabel,
  copyDisabled = false,
  sensitive = false,
}: ConnectionItemProps) {
  const displayValue = sensitive ? `${value.slice(0, 7)}••••••••${value.slice(-6)}` : value

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value)
      showSuccess(`${copyLabel ?? label}已复制`)
    } catch (caught) {
      showError(caught, '复制失败，请手动选择内容')
    }
  }

  return (
    <div className="mcp-connection-row">
      <span>{label}</span>
      <code title={sensitive ? '令牌已隐藏' : value}>{displayValue}</code>
      <Tooltip title={`复制${copyLabel ?? label}`}>
        <Button
          aria-label={`复制${copyLabel ?? label}`}
          disabled={copyDisabled}
          icon={<Copy size={15} />}
          size="small"
          type="text"
          onClick={() => void copyValue()}
        />
      </Tooltip>
    </div>
  )
}

function absoluteUrl(path: string): string {
  return new URL(path, window.location.origin).toString()
}

export function McpSettingsPage() {
  const [settings, setSettings] = useState<McpSettings | null>(null)
  const [credential, setCredential] = useState<McpCredential | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadSettings() {
      try {
        const next = await getMcpSettings()
        if (!cancelled) setSettings(next)
      } catch (caught) {
        if (!cancelled) showError(caught, 'MCP 配置加载失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadSettings()
    return () => {
      cancelled = true
    }
  }, [])

  const connection = useMemo(() => {
    if (!settings) return null
    const endpointUrl = absoluteUrl(settings.endpoint_path)
    const authorization = credential
      ? `${credential.token_type} ${credential.access_token}`
      : 'Bearer <MCP_ACCESS_TOKEN>'
    const config = {
      name: settings.server_name,
      transport: 'streamable-http',
      url: endpointUrl,
      headers: {
        Authorization: authorization,
      },
    }
    const displayConfig = {
      ...config,
      headers: {
        Authorization: 'Bearer <MCP_ACCESS_TOKEN>',
      },
    }
    const instructions = [
      `MCP 服务：${settings.server_name}`,
      `连接地址：${endpointUrl}`,
      '传输协议：Streamable HTTP',
      `鉴权方式：HTTP ${settings.token_parameter} 请求头`,
      `${settings.token_parameter}：${authorization}`,
      `可用能力：${settings.resources.map((resource) => `${resource.label} CRUD`).join('、')}`,
    ].join('\n')
    return { config, displayConfig, endpointUrl, instructions }
  }, [credential, settings])

  async function toggleEnabled(enabled: boolean) {
    setSaving(true)
    try {
      const updated = await updateMcpSettings({ enabled })
      setSettings(updated)
      if (!enabled) setCredential(null)
      showSuccess(enabled ? 'MCP 服务已启用' : 'MCP 服务已关闭')
    } catch (caught) {
      showError(caught, 'MCP 状态更新失败')
    } finally {
      setSaving(false)
    }
  }

  function issueCredential() {
    const rotating = settings?.credential_available ?? false
    Modal.confirm({
      title: rotating ? '轮换 MCP 连接令牌' : '生成 MCP 连接令牌',
      content: rotating
        ? '轮换后旧令牌立即失效，需要同步更新所有 AI 客户端。'
        : '令牌只会完整显示一次，请生成后立即复制到可信任的 AI 客户端。',
      okText: rotating ? '确认轮换' : '确认生成',
      cancelText: '取消',
      async onOk() {
        setGenerating(true)
        try {
          const issued = await createMcpCredential()
          setCredential(issued)
          setSettings((current) =>
            current
              ? {
                  ...current,
                  credential_available: true,
                  credential_issued_at: new Date().toISOString(),
                  credential_expires_at: issued.expires_at,
                }
              : current,
          )
          showSuccess(rotating ? 'MCP 连接令牌已轮换' : 'MCP 连接令牌已生成')
        } catch (caught) {
          showError(caught, 'MCP 连接令牌生成失败')
          throw caught
        } finally {
          setGenerating(false)
        }
      },
    })
  }

  async function copyAll() {
    if (!connection) return
    try {
      await navigator.clipboard.writeText(connection.instructions)
      showSuccess('全部连接信息已复制')
    } catch (caught) {
      showError(caught, '复制失败，请手动选择内容')
    }
  }

  async function copyConfig() {
    if (!connection) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(connection.config, null, 2))
      showSuccess('AI 客户端配置已复制')
    } catch (caught) {
      showError(caught, '复制失败，请手动选择内容')
    }
  }

  if (loading) {
    return <Skeleton active paragraph={{ rows: 9 }} />
  }

  if (!settings) {
    return (
      <Alert
        showIcon
        title="MCP 配置加载失败"
        description="请确认当前账号具备系统管理员权限后重试。"
        type="error"
      />
    )
  }

  return (
    <section className="mcp-settings-page">
      <section className={settings.enabled ? 'mcp-status-panel enabled' : 'mcp-status-panel'}>
        <div className="mcp-status-icon" aria-hidden="true">
          <Power size={22} />
        </div>
        <div className="mcp-status-copy">
          <div className="mcp-status-title">
            <h2>{settings.enabled ? 'MCP 服务已启用' : 'MCP 服务未启用'}</h2>
            <Tag color={settings.enabled ? 'green' : 'default'}>
              {settings.enabled ? '运行中' : '已关闭'}
            </Tag>
          </div>
          <p>
            允许受信任的 AI 客户端通过标准 MCP 协议查询和维护 ERP 数据。
            关闭后不会影响现有业务页面和 API。
          </p>
        </div>
        <div className="mcp-status-control">
          <span>是否启用 MCP</span>
          <Switch
            aria-label="是否启用 MCP"
            checked={settings.enabled}
            checkedChildren={<Check size={13} />}
            loading={saving}
            onChange={(checked) => void toggleEnabled(checked)}
          />
        </div>
      </section>

      {!settings.enabled ? (
        <section className="mcp-empty-panel">
          <Bot size={30} />
          <div>
            <h3>启用后即可查看 AI 连接信息</h3>
            <p>连接地址、鉴权令牌、客户端配置和全部可用工具只在 MCP 开启时展示。</p>
          </div>
        </section>
      ) : connection ? (
        <>
          {credential ? (
            <Alert
              showIcon
              title="新令牌仅在本页完整显示一次，请立即复制并妥善保存。"
              type="warning"
            />
          ) : settings.credential_available ? (
            <Alert
              showIcon
              title="已有连接令牌正在使用。出于安全考虑，系统不会再次显示原令牌；如已丢失请轮换。"
              type="info"
            />
          ) : (
            <Alert
              showIcon
              title="请先生成 MCP 专用连接令牌，再复制 AI 客户端配置。"
              type="info"
            />
          )}

          <div className="mcp-information-grid">
            <section className="mcp-information-panel" aria-label="连接与鉴权">
              <header className="mcp-panel-heading">
                <div>
                  <Network size={18} />
                  <div>
                    <h3>连接与鉴权</h3>
                    <p>AI 客户端建立连接所需的全部参数</p>
                  </div>
                </div>
                <div className="mcp-heading-actions">
                  <Button
                    aria-label={
                      settings.credential_available ? '轮换连接令牌' : '生成连接令牌'
                    }
                    loading={generating}
                    onClick={issueCredential}
                  >
                    {settings.credential_available ? '轮换令牌' : '生成令牌'}
                  </Button>
                  <Button
                    aria-label="复制全部连接信息"
                    disabled={!credential}
                    icon={<ClipboardCopy size={15} />}
                    onClick={() => void copyAll()}
                  >
                    复制全部
                  </Button>
                </div>
              </header>

              <div className="mcp-connection-list">
                <ConnectionItem label="MCP 服务地址" value={connection.endpointUrl} />
                <ConnectionItem label="传输协议" value="Streamable HTTP" />
                <ConnectionItem label="服务名称" value={settings.server_name} />
                <ConnectionItem label="鉴权请求头" value={settings.token_parameter} />
                <ConnectionItem
                  copyLabel="MCP 连接令牌"
                  copyDisabled={!credential}
                  label="MCP 连接令牌"
                  sensitive={Boolean(credential)}
                  value={credential?.access_token ?? '尚未在当前页面生成'}
                />
              </div>

              <div className="mcp-auth-note">
                <KeyRound size={17} />
                <div>
                  <strong>鉴权规则</strong>
                  <span>
                    AI 客户端通过 <code>{settings.token_parameter}</code> 请求头发送{' '}
                    <code>Bearer MCP_ACCESS_TOKEN</code>。该令牌只能访问 MCP
                    已开放的工具，不能用于普通 ERP API。
                  </span>
                </div>
              </div>
            </section>

            <section className="mcp-information-panel" aria-label="AI 客户端配置">
              <header className="mcp-panel-heading">
                <div>
                  <Bot size={18} />
                  <div>
                    <h3>AI 客户端配置</h3>
                    <p>可直接复制给支持 Streamable HTTP 的客户端</p>
                  </div>
                </div>
                <Button
                  disabled={!credential}
                  icon={<Copy size={15} />}
                  onClick={() => void copyConfig()}
                >
                  复制配置
                </Button>
              </header>
              <pre className="mcp-config-code">
                <code>{JSON.stringify(connection.displayConfig, null, 2)}</code>
              </pre>
            </section>
          </div>

          <section className="mcp-tools-panel" aria-label="AI 可用能力">
            <header className="mcp-panel-heading">
              <div>
                <PackageCheck size={18} />
                <div>
                  <h3>AI 可用能力</h3>
                  <p>当前共开放 {settings.tool_count} 个工具，沿用 ERP 账号权限和数据范围</p>
                </div>
              </div>
              <Tag icon={<ShieldCheck size={13} />} color="blue">
                权限隔离
              </Tag>
            </header>
            <div className="mcp-resource-grid">
              {settings.resources.map((resource) => (
                <article className="mcp-resource-group" key={resource.key}>
                  <strong>{resource.label}</strong>
                  <span>{resource.tools.length} 个工具</span>
                  <div>
                    {resource.tools.map((tool) => (
                      <code key={tool}>{tool}</code>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </section>
  )
}
