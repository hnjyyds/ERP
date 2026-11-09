import { Modal, Skeleton } from 'antd'
import { CalendarClock, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  deleteScheduleEvent,
  updateScheduleEvent,
  type Dashboard,
  type ScheduleCreatePayload,
  type ScheduleEvent,
} from '@/api'
import { PanelTitle } from '@/shared/ui'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'
import { formatDateTime } from '@/app/pages/appHelpers'
import {
  dashboardScheduleFormFromEvent,
  dateTimeLocalToIso,
  initialDashboardScheduleForm,
  parseDateTimeLocal,
  type DashboardScheduleFormState,
} from '../dashboardHelpers'
import { DashboardScheduleTimeline } from './DashboardScheduleTimeline'

export function DashboardSchedulesPage({
  dashboard,
  loading,
  onRefresh,
}: {
  dashboard: Dashboard | null
  loading: boolean
  onRefresh: () => Promise<void>
}) {
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleEvent | null>(null)
  const [editingSchedule, setEditingSchedule] = useState<ScheduleEvent | null>(null)
  const [editForm, setEditForm] = useState<DashboardScheduleFormState>(() =>
    initialDashboardScheduleForm(),
  )
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState('')
  const [actionError, setActionError] = useState('')
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTimeMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  if (loading && !dashboard) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  const schedules = dashboard?.schedule_events ?? []

  function confirmRemoveSchedule(schedule: ScheduleEvent) {
    Modal.confirm({
      centered: true,
      content: t('dashboard.deleteScheduleConfirm'),
      okButtonProps: { danger: true },
      okText: t('dashboard.deleteSchedule'),
      cancelText: t('common.cancel'),
      title: t('dashboard.deleteScheduleTitle'),
      onOk: async () => {
        setBusyAction(`schedule-delete-${schedule.id}`)
        setActionMessage('')
        setActionError('')
        try {
          await deleteScheduleEvent(schedule.id)
          setSelectedSchedule(null)
          setActionMessage(t('dashboard.scheduleDeleted'))
          await onRefresh()
        } catch (caught) {
          showError(caught, t('dashboard.operationFailed'))
        } finally {
          setBusyAction(null)
        }
      },
    })
  }

  function openScheduleEdit(schedule: ScheduleEvent) {
    setEditingSchedule(schedule)
    setEditForm(dashboardScheduleFormFromEvent(schedule))
    setSelectedSchedule(null)
  }

  async function submitScheduleEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingSchedule) return
    if (!editForm.title.trim() || !editForm.starts_at || !editForm.ends_at) {
      setActionError(t('dashboard.scheduleRequired'))
      return
    }
    const startsAt = parseDateTimeLocal(editForm.starts_at)
    const endsAt = parseDateTimeLocal(editForm.ends_at)
    if (
      !startsAt ||
      !endsAt ||
      Number.isNaN(startsAt.getTime()) ||
      Number.isNaN(endsAt.getTime()) ||
      endsAt <= startsAt
    ) {
      setActionError(t('dashboard.scheduleTimeInvalid'))
      return
    }
    const payload: ScheduleCreatePayload = {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      starts_at: dateTimeLocalToIso(editForm.starts_at),
      ends_at: dateTimeLocalToIso(editForm.ends_at),
    }
    setBusyAction(`schedule-edit-${editingSchedule.id}`)
    setActionError('')
    setActionMessage('')
    try {
      await updateScheduleEvent(editingSchedule.id, payload)
      setEditingSchedule(null)
      setActionMessage(t('dashboard.scheduleUpdated'))
      await onRefresh()
    } catch (caught) {
      showError(caught, t('dashboard.operationFailed'))
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <section className="dashboard-grid dashboard-dedicated-page">
      {actionError ? <div className="dashboard-feedback error">{actionError}</div> : null}
      {actionMessage ? <div className="dashboard-feedback success">{actionMessage}</div> : null}
      <section className="workspace-panel dashboard-panel dashboard-full-panel">
        <div className="dashboard-panel-heading dashboard-page-heading">
          <PanelTitle icon={<CalendarClock size={18} />} title={t('dashboard.mySchedule')} />
          <span className="dashboard-section-count">{schedules.length}</span>
        </div>
        {schedules.length ? (
          <DashboardScheduleTimeline
            currentTimeMs={currentTimeMs}
            events={schedules}
            onSelect={(event) => setSelectedSchedule(event)}
          />
        ) : (
          <div className="dashboard-empty">{t('dashboard.noSchedules')}</div>
        )}
      </section>

      <Modal
        centered
        footer={null}
        open={Boolean(selectedSchedule)}
        title={t('dashboard.scheduleDetail')}
        width={560}
        onCancel={() => setSelectedSchedule(null)}
      >
        {selectedSchedule ? (
          <section className="dashboard-detail">
            <header className="dashboard-detail-heading">
              <strong>{selectedSchedule.title}</strong>
              <span>
                {t('dashboard.timeRange', {
                  start: formatDateTime(selectedSchedule.starts_at),
                  end: formatDateTime(selectedSchedule.ends_at),
                })}
              </span>
            </header>
            <dl className="dashboard-detail-list">
              <div>
                <dt>{t('dashboard.start')}</dt>
                <dd>{formatDateTime(selectedSchedule.starts_at)}</dd>
              </div>
              <div>
                <dt>{t('dashboard.end')}</dt>
                <dd>{formatDateTime(selectedSchedule.ends_at)}</dd>
              </div>
              <div>
                <dt>{t('dashboard.createdAt')}</dt>
                <dd>{formatDateTime(selectedSchedule.created_at)}</dd>
              </div>
            </dl>
            <div className="dashboard-detail-note">
              <span>{t('dashboard.note')}</span>
              <p>{selectedSchedule.description?.trim() || t('dashboard.noNote')}</p>
            </div>
            <div className="modal-actions split">
              <div className="modal-actions">
                <button
                  className="secondary-inline"
                  type="button"
                  onClick={() => openScheduleEdit(selectedSchedule)}
                >
                  <Pencil size={15} />
                  {t('dashboard.editSchedule')}
                </button>
                <button
                  className="danger-inline"
                  disabled={busyAction === `schedule-delete-${selectedSchedule.id}`}
                  type="button"
                  onClick={() => confirmRemoveSchedule(selectedSchedule)}
                >
                  <Trash2 size={15} />
                  {t('dashboard.deleteSchedule')}
                </button>
              </div>
              <button
                className="secondary-inline"
                type="button"
                onClick={() => setSelectedSchedule(null)}
              >
                {t('common.close')}
              </button>
            </div>
          </section>
        ) : null}
      </Modal>

      <Modal
        centered
        footer={null}
        open={Boolean(editingSchedule)}
        title={t('dashboard.editSchedule')}
        width={620}
        onCancel={() => setEditingSchedule(null)}
      >
        <form className="dashboard-form modal-dashboard-form" onSubmit={submitScheduleEdit}>
          <label>
            <span>{t('dashboard.title')}</span>
            <input
              aria-label={t('dashboard.title')}
              value={editForm.title}
              onChange={(event) => setEditForm({ ...editForm, title: event.target.value })}
            />
          </label>
          <div className="dashboard-form-row">
            <label>
              <span>{t('dashboard.start')}</span>
              <input
                aria-label={t('dashboard.start')}
                type="datetime-local"
                value={editForm.starts_at}
                onChange={(event) => setEditForm({ ...editForm, starts_at: event.target.value })}
              />
            </label>
            <label>
              <span>{t('dashboard.end')}</span>
              <input
                aria-label={t('dashboard.end')}
                type="datetime-local"
                value={editForm.ends_at}
                onChange={(event) => setEditForm({ ...editForm, ends_at: event.target.value })}
              />
            </label>
          </div>
          <label>
            <span>{t('dashboard.note')}</span>
            <textarea
              aria-label={t('dashboard.note')}
              rows={3}
              value={editForm.description}
              onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
            />
          </label>
          <div className="modal-actions">
            <button
              className="secondary-inline"
              type="button"
              onClick={() => setEditingSchedule(null)}
            >
              {t('common.cancel')}
            </button>
            <button
              className="inline-submit"
              disabled={busyAction === `schedule-edit-${editingSchedule?.id}`}
              type="submit"
            >
              {t('dashboard.saveSchedule')}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  )
}
