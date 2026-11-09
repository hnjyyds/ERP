import { Modal } from 'antd'
import { Pencil, Trash2 } from 'lucide-react'
import type { ScheduleEvent } from '@/api'
import { t } from '@/app/appI18n'
import { formatDateTime } from '@/app/pages/appHelpers'

export function DashboardScheduleDetailModal({
  schedule,
  deleting,
  onEdit,
  onDelete,
  onClose,
}: {
  schedule: ScheduleEvent | null
  deleting: boolean
  onEdit: (schedule: ScheduleEvent) => void
  onDelete: (schedule: ScheduleEvent) => void
  onClose: () => void
}) {
  return (
    <Modal
      centered
      footer={null}
      open={Boolean(schedule)}
      title={t('dashboard.scheduleDetail')}
      width={560}
      onCancel={onClose}
    >
      {schedule ? (
        <section className="dashboard-detail">
          <header className="dashboard-detail-heading">
            <strong>{schedule.title}</strong>
            <span>
              {t('dashboard.timeRange', {
                start: formatDateTime(schedule.starts_at),
                end: formatDateTime(schedule.ends_at),
              })}
            </span>
          </header>
          <dl className="dashboard-detail-list">
            <div>
              <dt>{t('dashboard.start')}</dt>
              <dd>{formatDateTime(schedule.starts_at)}</dd>
            </div>
            <div>
              <dt>{t('dashboard.end')}</dt>
              <dd>{formatDateTime(schedule.ends_at)}</dd>
            </div>
            <div>
              <dt>{t('dashboard.createdAt')}</dt>
              <dd>{formatDateTime(schedule.created_at)}</dd>
            </div>
          </dl>
          <div className="dashboard-detail-note">
            <span>{t('dashboard.note')}</span>
            <p>{schedule.description?.trim() || t('dashboard.noNote')}</p>
          </div>
          <div className="modal-actions split">
            <div className="modal-actions">
              <button className="secondary-inline" type="button" onClick={() => onEdit(schedule)}>
                <Pencil size={15} />
                {t('dashboard.editSchedule')}
              </button>
              <button
                className="danger-inline"
                disabled={deleting}
                type="button"
                onClick={() => onDelete(schedule)}
              >
                <Trash2 size={15} />
                {t('dashboard.deleteSchedule')}
              </button>
            </div>
            <button className="secondary-inline" type="button" onClick={onClose}>
              {t('common.close')}
            </button>
          </div>
        </section>
      ) : null}
    </Modal>
  )
}
