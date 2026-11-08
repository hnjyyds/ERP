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
} from '@/api'
import { showError, showSuccess } from '@/shared/errors'
import { t } from '@/app/appI18n'
import { getRuntimeSettings } from '@/app/pages/appHelpers'

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

  const labelText = copyLabel ?? label

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value)
      showSuccess(t('system.mcp.message.copied', { label: labelText }))
    } catch (caught) {
      showError(caught, t('system.mcp.message.copyFailed'))
    }
  }

  return (
    <div className="mcp-connection-row">
      <span>{label}</span>
      <code title={sensitive ? t('system.mcp.message.tokenHidden') : value}>{displayValue}</code>
      <Tooltip title={t('system.mcp.action.copyLabel', { label: labelText })}>
        <Button
          aria-label={t('system.mcp.action.copyLabel', { label: labelText })}
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
        if (!cancelled) showError(caught, t('system.mcp.message.loadFailed'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadSettings()
    return () => {
      cancelled = true
    }
  }, [])

  const language = getRuntimeSettings().language
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
      t('system.mcp.text.instructionService', { name: settings.server_name }),
      t('system.mcp.text.instructionEndpoint', { url: endpointUrl }),
      t('system.mcp.text.instructionTransport'),
      t('system.mcp.text.instructionAuth', { header: settings.token_parameter }),
      t('system.mcp.text.instructionToken', {
        header: settings.token_parameter,
        token: authorization,
      }),
      t('system.mcp.text.instructionTools', {
        value: settings.resources
          .map((resource) => `${resource.label} CRUD`)
          .join(t('system.mcp.text.listSeparator')),
      }),
    ].join('\n')
    return { config, displayConfig, endpointUrl, instructions }
  }, [credential, language, settings])

  async function toggleEnabled(enabled: boolean) {
    setSaving(true)
    try {
      const updated = await updateMcpSettings({ enabled })
      setSettings(updated)
      if (!enabled) setCredential(null)
      showSuccess(enabled ? t('system.mcp.message.enabled') : t('system.mcp.message.disabled'))
    } catch (caught) {
      showError(caught, t('system.mcp.message.toggleFailed'))
    } finally {
      setSaving(false)
    }
  }

  function issueCredential() {
    const rotating = settings?.credential_available ?? false
    Modal.confirm({
      title: rotating
        ? t('system.mcp.modal.rotateTitle')
        : t('system.mcp.modal.generateTitle'),
      content: rotating
        ? t('system.mcp.modal.rotateDescription')
        : t('system.mcp.modal.generateDescription'),
      okText: rotating
        ? t('system.mcp.modal.rotateConfirm')
        : t('system.mcp.modal.generateConfirm'),
      cancelText: t('common.cancel'),
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
          showSuccess(
            rotating ? t('system.mcp.message.rotated') : t('system.mcp.message.generated'),
          )
        } catch (caught) {
          showError(caught, t('system.mcp.message.generateFailed'))
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
      showSuccess(t('system.mcp.message.allCopied'))
    } catch (caught) {
      showError(caught, t('system.mcp.message.copyFailed'))
    }
  }

  async function copyConfig() {
    if (!connection) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(connection.config, null, 2))
      showSuccess(t('system.mcp.message.configCopied'))
    } catch (caught) {
      showError(caught, t('system.mcp.message.copyFailed'))
    }
  }

  if (loading) {
    return <Skeleton active paragraph={{ rows: 9 }} />
  }

  if (!settings) {
    return (
      <Alert
        showIcon
        title={t('system.mcp.message.loadFailed')}
        description={t('system.mcp.message.loadFailedDescription')}
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
            <h2>
              {settings.enabled
                ? t('system.mcp.status.enabled')
                : t('system.mcp.status.disabled')}
            </h2>
            <Tag color={settings.enabled ? 'green' : 'default'}>
              {settings.enabled
                ? t('system.mcp.status.running')
                : t('system.mcp.status.stopped')}
            </Tag>
          </div>
          <p>{t('system.mcp.status.description')}</p>
        </div>
        <div className="mcp-status-control">
          <span>{t('system.mcp.field.enable')}</span>
          <Switch
            aria-label={t('system.mcp.field.enable')}
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
            <h3>{t('system.mcp.empty.title')}</h3>
            <p>{t('system.mcp.empty.description')}</p>
          </div>
        </section>
      ) : connection ? (
        <>
          {credential ? (
            <Alert showIcon title={t('system.mcp.message.newTokenWarning')} type="warning" />
          ) : settings.credential_available ? (
            <Alert showIcon title={t('system.mcp.message.existingTokenInfo')} type="info" />
          ) : (
            <Alert showIcon title={t('system.mcp.message.generateFirstInfo')} type="info" />
          )}

          <div className="mcp-information-grid">
            <section
              className="mcp-information-panel"
              aria-label={t('system.mcp.panel.connectionTitle')}
            >
              <header className="mcp-panel-heading">
                <div>
                  <Network size={18} />
                  <div>
                    <h3>{t('system.mcp.panel.connectionTitle')}</h3>
                    <p>{t('system.mcp.panel.connectionDescription')}</p>
                  </div>
                </div>
                <div className="mcp-heading-actions">
                  <Button
                    aria-label={
                      settings.credential_available
                        ? t('system.mcp.action.rotateAria')
                        : t('system.mcp.action.generateAria')
                    }
                    loading={generating}
                    onClick={issueCredential}
                  >
                    {settings.credential_available
                      ? t('system.mcp.action.rotate')
                      : t('system.mcp.action.generate')}
                  </Button>
                  <Button
                    aria-label={t('system.mcp.action.copyAllAria')}
                    disabled={!credential}
                    icon={<ClipboardCopy size={15} />}
                    onClick={() => void copyAll()}
                  >
                    {t('system.mcp.action.copyAll')}
                  </Button>
                </div>
              </header>

              <div className="mcp-connection-list">
                <ConnectionItem
                  label={t('system.mcp.field.endpoint')}
                  value={connection.endpointUrl}
                />
                <ConnectionItem label={t('system.mcp.field.transport')} value="Streamable HTTP" />
                <ConnectionItem
                  label={t('system.mcp.field.serverName')}
                  value={settings.server_name}
                />
                <ConnectionItem
                  label={t('system.mcp.field.tokenParameter')}
                  value={settings.token_parameter}
                />
                <ConnectionItem
                  copyLabel={t('system.mcp.field.accessToken')}
                  copyDisabled={!credential}
                  label={t('system.mcp.field.accessToken')}
                  sensitive={Boolean(credential)}
                  value={credential?.access_token ?? t('system.mcp.field.tokenNotGenerated')}
                />
              </div>

              <div className="mcp-auth-note">
                <KeyRound size={17} />
                <div>
                  <strong>{t('system.mcp.panel.authRules')}</strong>
                  <span>
                    {t('system.mcp.panel.authNoteThrough')}{' '}
                    <code>{settings.token_parameter}</code>{' '}
                    {t('system.mcp.panel.authNoteVia')}{' '}
                    <code>Bearer MCP_ACCESS_TOKEN</code>
                    {t('system.mcp.panel.authNoteSuffix')}
                  </span>
                </div>
              </div>
            </section>

            <section
              className="mcp-information-panel"
              aria-label={t('system.mcp.panel.clientConfigTitle')}
            >
              <header className="mcp-panel-heading">
                <div>
                  <Bot size={18} />
                  <div>
                    <h3>{t('system.mcp.panel.clientConfigTitle')}</h3>
                    <p>{t('system.mcp.panel.clientConfigDescription')}</p>
                  </div>
                </div>
                <Button
                  disabled={!credential}
                  icon={<Copy size={15} />}
                  onClick={() => void copyConfig()}
                >
                  {t('system.mcp.action.copyConfig')}
                </Button>
              </header>
              <pre className="mcp-config-code">
                <code>{JSON.stringify(connection.displayConfig, null, 2)}</code>
              </pre>
            </section>
          </div>

          <section className="mcp-tools-panel" aria-label={t('system.mcp.panel.toolsTitle')}>
            <header className="mcp-panel-heading">
              <div>
                <PackageCheck size={18} />
                <div>
                  <h3>{t('system.mcp.panel.toolsTitle')}</h3>
                  <p>{t('system.mcp.panel.toolsDescription', { count: settings.tool_count })}</p>
                </div>
              </div>
              <Tag icon={<ShieldCheck size={13} />} color="blue">
                {t('system.mcp.panel.permissionIsolation')}
              </Tag>
            </header>
            <div className="mcp-resource-grid">
              {settings.resources.map((resource) => (
                <article className="mcp-resource-group" key={resource.key}>
                  <strong>{resource.label}</strong>
                  <span>{t('system.mcp.table.toolCount', { count: resource.tools.length })}</span>
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
