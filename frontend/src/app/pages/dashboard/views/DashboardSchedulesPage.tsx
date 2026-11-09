import { Modal, Skeleton } from 'antd'
import { CalendarClock, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { deleteScheduleEvent, type Dashboard, type ScheduleEvent } from '@/api'
import { PanelTitle } from '@/shared/ui'
import { showError } from '@/shared/errors'
import { t } from '@/app/appI18n'
import { formatDateTime } from '@/app/pages/appHelpers'
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
              <button
                className="danger-inline"
                disabled={busyAction === `schedule-delete-${selectedSchedule.id}`}
                type="button"
                onClick={() => confirmRemoveSchedule(selectedSchedule)}
              >
                <Trash2 size={15} />
                {t('dashboard.deleteSchedule')}
              </button>
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
    </section>
  )
}
