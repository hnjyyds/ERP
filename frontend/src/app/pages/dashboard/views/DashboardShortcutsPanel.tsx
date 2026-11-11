import { Modal } from 'antd'
import { LayoutGrid, Plus, Settings2, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { DashboardShortcut, MenuItem, ShortcutCreatePayload } from '@/api'
import { PanelTitle } from '@/shared/ui'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'
import {
  recommendedShortcutTargets,
  shortcutIcon,
  shortcutIconKeys,
  shortcutIconLabel,
  shortcutTargetOptions,
} from '../shortcutCatalog'

type ShortcutFormState = {
  label: string
  target_path: string
  icon: string
  sort_order: string
}

const emptyForm: ShortcutFormState = {
  label: '',
  target_path: '',
  icon: 'layout-dashboard',
  sort_order: '100',
}

export function DashboardShortcutsPanel({
  shortcuts,
  menus,
  canNavigatePath,
  onNavigate,
  onCreate,
  onDelete,
}: {
  shortcuts: DashboardShortcut[]
  menus: MenuItem[]
  canNavigatePath: (path: string) => boolean
  onNavigate: (path: string) => void
  onCreate: (payload: ShortcutCreatePayload) => Promise<void>
  onDelete: (shortcutId: string) => Promise<void>
}) {
  const [manageOpen, setManageOpen] = useState(false)
  const [form, setForm] = useState<ShortcutFormState>(emptyForm)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const targetOptions = useMemo(() => shortcutTargetOptions(menus), [menus])
  const recommended = useMemo(() => recommendedShortcutTargets(menus), [menus])

  function canOpen(path: string) {
    return canNavigatePath(path.split('?')[0])
  }

  function openShortcut(path: string) {
    if (!canOpen(path)) return
    onNavigate(path)
  }

  async function submitShortcut(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const label = form.label.trim()
    if (!label || !form.target_path) {
      setError(t('dashboard.shortcutRequired'))
      return
    }
    setBusyAction('create')
    setError('')
    setMessage('')
    try {
      await onCreate({
        label,
        target_path: form.target_path,
        icon: form.icon,
        sort_order: Number(form.sort_order) || 0,
      })
      setForm(emptyForm)
      setMessage(t('dashboard.shortcutCreated'))
    } catch (caught) {
      showError(caught, t('dashboard.operationFailed'))
    } finally {
      setBusyAction(null)
    }
  }

  async function removeShortcut(shortcut: DashboardShortcut) {
    setBusyAction(`delete-${shortcut.id}`)
    setError('')
    setMessage('')
    try {
      await onDelete(shortcut.id)
      setMessage(t('dashboard.shortcutDeleted'))
    } catch (caught) {
      showError(caught, t('dashboard.operationFailed'))
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <section className="workspace-panel dashboard-panel dashboard-shortcut-panel">
      <div className="dashboard-panel-heading">
        <PanelTitle icon={<LayoutGrid size={18} />} title={t('dashboard.shortcuts')} />
        <button
          className="panel-action-button panel-link-button"
          type="button"
          onClick={() => {
            setError('')
            setMessage('')
            setManageOpen(true)
          }}
        >
          <Settings2 size={15} />
          {t('dashboard.manageShortcuts')}
        </button>
      </div>

      {shortcuts.length ? (
        <div className="dashboard-shortcut-grid">
          {shortcuts.map((shortcut) => {
            const Icon = shortcutIcon(shortcut.icon)
            const allowed = canOpen(shortcut.target_path)
            return (
              <button
                className="dashboard-shortcut"
                disabled={!allowed}
                key={shortcut.id}
                title={allowed ? shortcut.target_path : t('dashboard.shortcutDenied')}
                type="button"
                onClick={() => openShortcut(shortcut.target_path)}
              >
                <span className="dashboard-shortcut-icon">
                  <Icon size={18} />
                </span>
                <span>{shortcut.label}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="dashboard-shortcut-empty">
          <div>
            <strong>{t('dashboard.shortcutEmpty')}</strong>
            <span>{t('dashboard.shortcutRecommended')}</span>
          </div>
          <span className="dashboard-shortcut-suggested-label">
            {t('dashboard.shortcutRecommendedLabel')}
          </span>
          <div className="dashboard-shortcut-grid">
            {recommended.map((option) => {
              const Icon = shortcutIcon('layout-dashboard')
              return (
                <button
                  className="dashboard-shortcut"
                  key={option.value}
                  type="button"
                  onClick={() => openShortcut(option.value)}
                >
                  <span className="dashboard-shortcut-icon">
                    <Icon size={18} />
                  </span>
                  <span>{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <Modal
        centered
        footer={null}
        open={manageOpen}
        title={t('dashboard.manageShortcuts')}
        width={640}
        onCancel={() => setManageOpen(false)}
      >
        <section className="dashboard-shortcut-manager">
          {message ? <div className="dashboard-feedback success">{message}</div> : null}
          {error ? <div className="dashboard-feedback error">{error}</div> : null}

          <div className="dashboard-shortcut-managed-list">
            {shortcuts.length ? (
              shortcuts.map((shortcut) => (
                <div className="dashboard-shortcut-managed-row" key={shortcut.id}>
                  <div>
                    <strong>{shortcut.label}</strong>
                    <small>{shortcut.target_path}</small>
                  </div>
                  <button
                    className="danger-inline"
                    disabled={busyAction === `delete-${shortcut.id}`}
                    type="button"
                    onClick={() => void removeShortcut(shortcut)}
                  >
                    <Trash2 size={14} />
                    {t('common.delete')}
                  </button>
                </div>
              ))
            ) : (
              <div className="dashboard-empty">{t('dashboard.shortcutEmpty')}</div>
            )}
          </div>

          <form className="dashboard-form modal-dashboard-form" onSubmit={submitShortcut}>
            <label>
              <span>{t('dashboard.shortcutName')}</span>
              <input
                aria-label={t('dashboard.shortcutName')}
                maxLength={80}
                value={form.label}
                onChange={(event) => setForm({ ...form, label: event.target.value })}
              />
            </label>
            <label>
              <span>{t('dashboard.shortcutTarget')}</span>
              <select
                aria-label={t('dashboard.shortcutTarget')}
                value={form.target_path}
                onChange={(event) => setForm({ ...form, target_path: event.target.value })}
              >
                <option value="">{t('dashboard.shortcutTargetPlaceholder')}</option>
                {targetOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="dashboard-form-row">
              <label>
                <span>{t('dashboard.shortcutIcon')}</span>
                <select
                  aria-label={t('dashboard.shortcutIcon')}
                  value={form.icon}
                  onChange={(event) => setForm({ ...form, icon: event.target.value })}
                >
                  {shortcutIconKeys.map((key) => (
                    <option key={key} value={key}>
                      {shortcutIconLabel(key)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t('dashboard.shortcutSort')}</span>
                <input
                  aria-label={t('dashboard.shortcutSort')}
                  max={9999}
                  min={0}
                  type="number"
                  value={form.sort_order}
                  onChange={(event) => setForm({ ...form, sort_order: event.target.value })}
                />
              </label>
            </div>
            <div className="modal-actions">
              <button
                className="secondary-inline"
                type="button"
                onClick={() => setManageOpen(false)}
              >
                {t('common.close')}
              </button>
              <button className="inline-submit" disabled={busyAction === 'create'} type="submit">
                <Plus size={15} />
                {t('dashboard.shortcutAdd')}
              </button>
            </div>
          </form>
        </section>
      </Modal>
    </section>
  )
}
