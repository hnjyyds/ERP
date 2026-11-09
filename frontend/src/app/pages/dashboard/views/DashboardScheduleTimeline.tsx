import type { ScheduleEvent } from '@/api'
import { t } from '@/app/appI18n'
import { formatDate, formatTime } from '@/app/pages/appHelpers'
import { scheduleCountdownLabel } from '../dashboardHelpers'

export function DashboardScheduleTimeline({
  events,
  currentTimeMs,
  onSelect,
}: {
  events: ScheduleEvent[]
  currentTimeMs: number
  onSelect: (event: ScheduleEvent) => void
}) {
  return (
    <div className="dashboard-timeline">
      {events.map((event) => {
        const countdown = scheduleCountdownLabel(event.starts_at, event.ends_at, currentTimeMs)

        return (
          <button
            aria-label={event.title}
            className="dashboard-timeline-item"
            key={event.id}
            type="button"
            onClick={() => onSelect(event)}
          >
            <span className="dashboard-timeline-time">
              <strong>{formatTime(event.starts_at)}</strong>
              <small>{formatDate(event.starts_at)}</small>
              <em className={`dashboard-timeline-countdown ${countdown.tone}`}>
                {countdown.segments ? (
                  <span className="dashboard-timeline-countdown-parts">
                    {countdown.segments.map((segment, index) => (
                      <span className="dashboard-timeline-countdown-piece" key={`${segment.unit}-${index}`}>
                        <span className="dashboard-timeline-countdown-value">{segment.value}</span>
                        <span className="dashboard-timeline-countdown-unit">{segment.unit}</span>
                        {index < countdown.segments.length - 1 ? (
                          <span className="dashboard-timeline-countdown-dot" aria-hidden="true" />
                        ) : null}
                      </span>
                    ))}
                  </span>
                ) : (
                  countdown.label
                )}
              </em>
            </span>
            <span className="dashboard-timeline-pin" aria-hidden="true" />
            <span className="dashboard-timeline-content">
              <span className="dashboard-timeline-title">{event.title}</span>
              <span className="dashboard-timeline-note">
                {event.description?.trim() ||
                  t('dashboard.timeRange', {
                    start: formatTime(event.starts_at),
                    end: formatTime(event.ends_at),
                  })}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
